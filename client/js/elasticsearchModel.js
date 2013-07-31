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

    getIndicesFromDates: function (dates) {
        var indices = [];
        if(dates.from && dates.to) {

            var from = new Date(dates.from).getFullYear();
            var to = new Date(dates.to).getFullYear();
            var tmp = from;
            for (tmp; tmp <= to; tmp++) {
                indices.push("" + tmp);
            }
        } else
            indices = "_all";
        console.log("indices: " + indices);
        return indices;
    },

    makeFilterWithDateAccNoCategory: function (dataObject) {

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

        if (dataObject.category) {
            var categoryFilter = ejs.TermsFilter(dataObject.category.name, dataObject.category.value.split(","));
            filter.filters(categoryFilter);
        }

        return filter;
    },

    buildQuery: function (params) {
        var indicesFromDate = this.getIndicesFromDates({from:params.from.value,to:params.to.value});
        var request = ejs.Request({indices:indicesFromDate,types:"trans"});

        var filter = this.makeFilterWithDateAccNoCategory(params);

        if (params.size.value) {
            request.size(params.size.value);
        }

        var query;
        if (params.freeText.value) {
            query = ejs.MatchQuery(
                            params.searchField.value,
                            params.freeText.value
            );
        }else {
            query = ejs.MatchAllQuery();
        }
        request.query(ejs.FilteredQuery(query,filter));

        request.fields([
            "accountNumber",
            "description",
            "date",
            "bokforingDate",
            "amount",
            "transactionCode",
            "id",
            "category"
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
            //multi-select is converted to a single comma separated field.
            if(processedArray[dataArray[obj].name]) {
                processedArray[dataArray[obj].name].value += ","+dataArray[obj].value;
            } else {
                processedArray[dataArray[obj].name] = dataArray[obj];
            }
        }
        return processedArray;
    },

    buildDateFacetQuery: function (dataObject) {
        var indicesFromDate = this.getIndicesFromDates({from:dataObject.from.value,to:dataObject.to.value});
        var request = ejs.Request({indices:indicesFromDate,types:"trans"});
        var filter = this.makeFilterWithDateAccNoCategory(dataObject);
        var facet = ejs.DateHistogramFacet("histogram");

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

    buildCategoryFacetQuery: function (dataObject) {
        var indicesFromDate = this.getIndicesFromDates({from:dataObject.from.value,to:dataObject.to.value});
        var request = ejs.Request({indices:indicesFromDate,types:"trans"});
        var filter = this.makeFilterWithDateAccNoCategory(dataObject);
        var facet = ejs.TermStatsFacet("histogram");

        facet.facetFilter(filter);
        facet.keyField("category");
        facet.valueField("amount");

        request.query(ejs.MatchAllQuery());
        request.routing(dataObject.accountNumber.value);
        request.size(0);
        request.facet(facet);
        this.interval = "category";

        return request;
    },

    buildAndExecuteQuery: function (dataArray, type) {
        var dataObject = this.arrayToObject(dataArray);
        console.log(dataObject);
        //date strings to millis
        dataObject.to.value = new Date(dataObject.to.value).getTime();
        dataObject.from.value = new Date(dataObject.from.value).getTime();

        var request;
        if(type == "basic") {
            request = this.buildQuery(dataObject);
            this.lastQuery = dataObject;

        } else if (type == "time-aggregated"){
            request = this.buildDateFacetQuery(dataObject);

        } else if (type == "category-aggregated") {
            request = this.buildCategoryFacetQuery(dataObject);

        }else {
            alert("Unsupported search type: " + typeString);
        }

        request.doSearch(
            this.searchDone.bind(this),
            this.handleError);
        this.trigger("SEARCH:started");
    },

    searchDone: function (data) {
        var structuredData;
        if (data.facets) {
            structuredData = this.structureHistogramFromServer(data);
        } else {
            structuredData = this.structureDataFromServer(data);
        }
        console.log(structuredData); //DEBUG
        structuredData = this.convertAmountsToKrString(structuredData);

        this.trigger("SEARCH:done", structuredData);
    },

    handleError: function (errorData) {
        Simple.events.trigger("ERROR:display", {msg:"Server Error!", data:errorData});
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
        structuredData.display = "histogram";
        structuredData.interval = this.interval;
        var entryName = (this.interval == "category") ? "terms" : "entries";
        var totalCount = 0;
        for(var i in data.facets.histogram[entryName]) {
            structuredData.entries.push(data.facets.histogram[entryName][i]);
            totalCount += data.facets.histogram[entryName][i].count;
        }
        structuredData.totalCount = totalCount;
        return structuredData;
    },

    convertAmountsToKrString: function (structuredData) {
        if(structuredData.hits) {
            var hits =  structuredData.hits;
            for (var hit in hits) {
                console.log();
                hits[hit].amount = (hits[hit].amount/100).toFixed(2);
            }
        }
        if (structuredData.entries) {
            var entries = structuredData.entries;
            for (var entry in entries) {
                entries[entry].total = (entries[entry].total/100).toFixed(2);
            }
        }
        console.log(structuredData.hits);console.log(structuredData.entries);
        console.log(structuredData);
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