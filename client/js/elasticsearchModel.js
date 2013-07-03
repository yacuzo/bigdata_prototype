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
        ejs.client = ejs.jQueryClient('http://bigdata01.dev.bekk.no:9200');
    },

    buildQuery: function (params) {
        var request = ejs.Request({indices:"sb1",types:"transer"});
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
    buildAndExecuteQuery: function (dataArray) {
        var dataObject = this.arrayToObject(dataArray);
        dataObject.to.value = new Date(dataObject.to.value).getTime();
        dataObject.from.value = new Date(dataObject.from.value).getTime();

        var request = this.buildQuery(dataObject);
        console.log("Request: "); console.log(request.toString());

        request.doSearch(
            $.proxy(this.searchDone, this)
        );
    },

    searchDone: function (data) {
        var hits = data.hits.hits;
        this.trigger("GET:done", {hits: hits, took: data.took});
    }

});