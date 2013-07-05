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
        integers.month = parseInt(date.getMonth());
        return integers;
    },

    getIndicesFromDates: function (dates) {
        var indices = [];
        if(dates.from && dates.to) {
            var from = this.dateToIntegers(new Date(dates.from));
            var to = this.dateToIntegers(new Date(dates.to));
            var numMonths = ((to.year - from.year) * 12) + to.month - from.month + 1;
            var year = from.year;
            var month = from.month - 1; //bd starts months on 0...

            for(numMonths; numMonths > 0; numMonths--) {
                month++;
                if (month >= 12) {
                    year++;
                    month = 0;
                }
                indices.push("" + year + "-" + month);
            }
        } else
            indices = "_all";
        console.log("indices: " + indices);
        return indices;
    },
    buildQuery: function (params) {
        var indicesFromDate = this.getIndicesFromDates({from:params.from.value,to:params.to.value});
        var request = ejs.Request({indices:indicesFromDate,types:"trans"});
        //noinspection JSUnresolvedVariable
        var filter = ejs.AndFilter(
                                ejs.TermFilter(
                                    params.accountNumber.name,
                                    params.accountNumber.value
        ));

        //adds to existing filter if dates are set
        if(params.from.value || params.from.value) {
            var rFilter = ejs.RangeFilter("bokforingDate");

            if(params.from.value)
                rFilter.from(params.from.value)

            if(params.to.value)
                rFilter.to(params.to.value)

            filter.filters(rFilter);
        }

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
            "account",
            "fullDescription",
            "description",
            "date",
            "bokforingDate",
            "amount",
            "transactionTypeText",
            "id"
        ]);
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
    buildAndExecuteQuery: function (dataArray, typeString) {
        var dataObject = this.arrayToObject(dataArray);
        console.log(dataObject);
        //date strings to millis
        dataObject.to.value = new Date(dataObject.to.value).getTime();
        dataObject.from.value = new Date(dataObject.from.value).getTime();

        if(typeString == "basic") {
            var request = this.buildQuery(dataObject);
            console.log("Request: "); console.log(request.toString());

            request.doSearch(
                $.proxy(this.searchDone, this),
                function (errorData) {Simple.events.trigger("ERROR:server", errorData);}
            );
        } else
            alert("Unsupported search type: " + typeString);
    },

    searchDone: function (data) {
        var structuredData = this.structureDataFromServer(data);
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
    }

});