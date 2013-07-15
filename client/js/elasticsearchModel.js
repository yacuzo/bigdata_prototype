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
        ejs.client = ejs.jQueryClient(this.url);
        Simple.events.on("ERROR:server", this.handleError, this);
        Simple.events.on("list:getNextPage", this.getNextPage, this);
    },

    dateToIntegers: function (date){
        var integers = {};
        integers.year = parseInt(date.getFullYear());
        integers.month = parseInt(date.getMonth())+1;
        return integers;
        //TODO cleanup, nothing uses month?
    },

    getIndicesFromDates: function (dates) {
        //TODO when dateToIntegers is cleaned, clean this
        var indices = [];
        if(dates.from && dates.to) {
            var from = this.dateToIntegers(new Date(dates.from));
            var to = this.dateToIntegers(new Date(dates.to));
            var tmp = from.year;
            for (tmp; tmp < to.year; tmp++) {
                indices.push("" + tmp);
            }
        } else
            indices = "_all";
        console.log("indices: " + indices);
        return indices;
    },

    makeFilterWithDateAndAccNo: function (dataObject) {
        var filter = ejs.AndFilter(
            ejs.TermsFilter(
                dataObject.accountNumber.name,
                dataObject.accountNumber.value.split(",")
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

        var filter = this.makeFilterWithDateAndAccNo(params);
        if (params.size.value) {
            request.size(params.size.value);
        }

        if (params.freeText.value) {
            var query = ejs.MatchQuery(
                            params.searchField.value,
                            params.freeText.value
            );//silly elastic.js needs a query for a filteredQuery =/
            request.query(ejs.FilteredQuery(query, filter));
        }else {
            request.query(ejs.FilteredQuery(ejs.MatchAllQuery(),filter));
        }
        request.fields([
            "accountNumber",
            "description",
            "date",
            "bokforingDate",
            "amount",
            "transactionCode",
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
            //multi-select yields multiple entries, not comma separated :(
            if(processedArray.accountNumber && dataArray[obj].name == "accountNumber") {
                processedArray.accountNumber.value += ","+dataArray[obj].value;
            } else {
                processedArray[dataArray[obj].name] = dataArray[obj];
            }
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
        facet.interval(dataObject.interval.value);
        facet.preZone(2);

        request.query(ejs.MatchAllQuery());
        request.routing(dataObject.accountNumber.value);
        request.size(0);
        request.facet(facet);
        this.interval = dataObject.interval.value;

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
            this.lastQuery = dataObject;

        } else if (type == "aggregated"){
            var request = this.buildDateFacetQuery(dataObject);

        } else
            alert("Unsupported search type: " + typeString);

        request.doSearch(
            this.searchDone.bind(this),
            this.handleError);
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
        var structuredData = {hits:[]};
        for(var i in data.hits.hits) {
            structuredData.hits.push(data.hits.hits[i].fields);
        }
        structuredData.totalHits = data.hits.total;
        structuredData.took = data.took;
        return structuredData;
    },

    structureHistogramFromServer: function (data) {
        var structuredData = {entries:[]};
        structuredData.took = data.took;
        structuredData.display = "dateHistogram";
        structuredData.interval = this.interval;
        var totalCount = 0;
        for(var i in data.facets.dateHistogram.entries) {
            structuredData.entries.push(data.facets.dateHistogram.entries[i]);
            totalCount += data.facets.dateHistogram.entries[i].count;
        }
        structuredData.totalCount = totalCount;
        return structuredData;
    },

    getNextPage: function (options) {
        var request = this.buildQuery(this.lastQuery);
        request.size(options.perPage);
        request.from(options.page * options.perPage);
        request.doSearch(
            this.nextPageReady.bind(this),
            this.handleError);
    },

    nextPageReady: function(data) {
        var structuredData = this.structureDataFromServer(data);
        Simple.events.trigger("list:displayNextPage", structuredData);
    }

});