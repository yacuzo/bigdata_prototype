/**
 * Created with IntelliJ IDEA.
 * User: andre b. amundsen
 * Date: 6/27/13
 * Time: 1:32 PM
 * To change this template use File | Settings | File Templates.
 */

var ElasticsearchModel;

ElasticsearchModel = Simple.Model.extend({
    initialize: function(options) {
        this.url = options.url;
        ejs.client = ejs.jQueryClient('http://el4:9200');
        Simple.events.on("ERROR:server", this.handleError, this);
    },

    dateToIntegers: function (date){
        var integers = {};
        integers.year = parseInt(date.getFullYear());
        integers.month = parseInt(date.getMonth())+1;
        return integers;
    },

    getIndicesFromDates: function (dates) {
        var indices = [];
        if(dates.from && dates.to) {
            var from = this.dateToIntegers(new Date(dates.from));
            var to = this.dateToIntegers(new Date(dates.to));
            var numMonths = ((to.year - from.year) * 12) + to.month - from.month + 1;
            var year = from.year;
            var month = from.month;

            for(numMonths; numMonths > 0; numMonths--) {
                indices.push("" + year + "-" + ("0" + month).slice(-2));
                month++;
                if (month > 12) {
                    year++;
                    month = 1;
                }
            }
        } else
            indices = "_all";
        console.log("indices: " + indices);
        return indices;
    },

    makeFilterWithDateAndAccNo: function (dataObject) {
        var filter = ejs.AndFilter(
            ejs.TermFilter(
                dataObject.accountNumber.name,
                dataObject.accountNumber.value
            ));

        //adds to existing filter if dates are set
        if(dataObject.from.value || dataObject.from.value) {
            var rFilter = ejs.RangeFilter("bokforingDate");

            if(dataObject.from.value)
                rFilter.from(dataObject.from.value)

            if(dataObject.to.value)
                rFilter.to(dataObject.to.value)

            filter.filters(rFilter);
        }
        return filter;
    },
    buildQuery: function (params) {
        var indicesFromDate = this.getIndicesFromDates({from:params.from.value,to:params.to.value});
        var request = ejs.Request({indices:indicesFromDate,types:"trans"});
        //noinspection JSUnresolvedVariable

        var filter = this.makeFilterWithDateAndAccNo(params);
        if (params.size.value) {
            request.size(params.size.value);
        }

        if (params.fullDescription.value) {
            var query = ejs.MatchQuery(
                            params.fullDescription.name,
                            params.fullDescription.value
            );
            request.query(query);
        }
        request.fields([
            "accountNumber",
            "fullDescription",
            "description",
            "date",
            "bokforingDate",
            "amount",
            "transactionCodeText",
            "id"
        ]);
        request.routing(params.accountNumber.value);
        return request.filter(filter);
    },

    /**
     * Turns the array into and object with member who's name reflects the tag names of the html input tags
     * @param dataArray
     * @returns {name1:{original obj1}, name2:{original obj2}...}
     */
    arrayToObject: function (dataArray) {
        var processedArray = {};
        for(var obj in dataArray) {
            processedArray[dataArray[obj].name] = dataArray[obj];
        }
        return processedArray;
    },
    buildDateFacetQuery: function (dataObject) {
        var indicesFromDate = this.getIndicesFromDates({from:dataObject.from.value,to:dataObject.to.value});
        var request = ejs.Request({indices:indicesFromDate,types:"trans"});
        var filter = this.makeFilterWithDateAndAccNo(dataObject);
        var facet = ejs.DateHistogramFacet("dateHistogram");

        facet.facetFilter(filter);
        facet.keyField("date");
        facet.valueField("amount");
        facet.interval("month");
        facet.preZone(2);

        request.query(ejs.MatchAllQuery());
        request.routing(dataObject.accountNumber.value);
        request.size(0);
        request.facet(facet);

        return request;
    },
    buildAndExecuteQuery: function (dataArray, type) {
        var dataObject = this.arrayToObject(dataArray);
        console.log(dataObject);
        //date strings to millis
        dataObject.to.value = new Date(dataObject.to.value).getTime();
        dataObject.from.value = new Date(dataObject.from.value).getTime();

        if(type == "basic") {
            var request = this.buildQuery(dataObject);

            request.doSearch(
                $.proxy(this.searchDone, this),
                this.handleError
            );
        } else if (type == "aggregated"){
            var request = this.buildDateFacetQuery(dataObject);

            request.doSearch(
                this.searchDone.bind(this),
                this.handleError);
        } else
            alert("Unsupported search type: " + typeString);
    },

    searchDone: function (data) {
        var structuredData;
        if (data.facets) {
            structuredData = this.structureHistogramFromServer(data);
        } else {
            structuredData = this.structureDataFromServer(data);
        }
        this.trigger("SEARCH:done", structuredData);
    },

    handleError: function (errorData) {
        Simple.events.trigger("ERROR:display", "Server Error!" + errorData.toString());
    },

    structureDataFromServer: function (data) {
        console.log(data);
        var structuredData = {hits:[]};
        structuredData.took = data.took;
        for(var i in data.hits.hits) {
            structuredData.hits.push(data.hits.hits[i].fields);
        }
        console.log(structuredData);
        return structuredData;
    },

    structureHistogramFromServer: function (data) {
        console.log(data);
        var structuredData = {entries:[]};
        structuredData.took = data.took;
        structuredData.display = "dateHistogram";
        var totalCount = 0;
        for(var i in data.facets.dateHistogram.entries) {
            structuredData.entries.push(data.facets.dateHistogram.entries[i]);
            totalCount += data.facets.dateHistogram.entries[i].count;
        }
        structuredData.totalCount = totalCount;
        console.log(structuredData);
        return structuredData;
    }

});