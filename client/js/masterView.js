/**
 * Created with IntelliJ IDEA.
 * User: andre b. amundsen
 * Date: 6/27/13
 * Time: 1:31 PM
 * To change this template use File | Settings | File Templates.
 */

var MasterView;
MasterView = Simple.View.extend({
    //el: $();
    //model: model
    template :  '<div id="searchTabs">' +
                    '<ul>'+
                        '<li><a href="#searchType-1"><span>Enkelt søk</span></a></li>' +
                        '<li><a href="#searchType-2"><span>Aggregering</span></a></li>' +
                    '</ul>' +
                    '<form class="simpleSearch" id="searchType-1" name="basic">' +
                        '<input class="calendar" name="from" type="date" min="2008-01-01" max="2009-12-31"/>' +
                        '<input class="calendar" name="to" type="date" min="2008-01-01" max="2009-12-31"/>' +
                        '<input id="text" name="fullDescription" type="search" placeholder="Søk i beskrivelse"/>' +
                        '<select id="accounts" name="accountNumber"><option value="base">Select account</option></select>' +
                        '<input name="size" type="number" placeholder="Max Antall Treff"/>' +
                        '<input id="submit" type="submit"/>' +
                    '</form>' +
                    '<form class="simpleSearch" id="searchType-2" name="aggregated">' +
                        '<input class="calendar" name="from" type="date" min="2008-01-01" max="2009-12-31"/>' +
                        '<input class="calendar" name="to" type="date" min="2008-01-01" max="2009-12-31"/>' +
                        '<select id="direction" name="direction">' +
                            '<option value="base">Inn/ut</option>' +
                            '<option value="in">Inntekter</option>' +
                            '<option value="out">Utgifter</option>' +
                            '<option value="sum">Sum</option>' +
                        '</select>' +
                        '<select id="accounts2" name="accountNumber"><option value="base">Select account</option></select>' +
                        '<input id="submit" type="submit"/>' +
                    '</form>' +
                '</div>' +

                '<div id="results"></div>' +
                '<footer></footer>',

    initialize: function(options) {//constructor
        this.render();
        this.model = options.model;
        this.model.on("SEARCH:done", this.selectDisplay, this);
        Simple.events.on("ERROR:display", this.displayError, this);
    },
    events: {
        "submit #searchType-1":"gatherData",
        "submit #searchType-2":"gatherData"
    }, //lytte på dom events

    render: function () {
        this.el.append(this.template);
        this.fillAccountList();
        this.$("#searchTabs").tabs();
    },

    fillAccountList: function () {
        $.getJSON("textdata/accounts.json", function(data) {

            for (var obj in data) {
                //noinspection JSUnresolvedVariable
                $("#accounts, #accounts2").append("<option value='" + data[obj].account + "'>" + data[obj].account + "</option>")
            }

        });
    },

    gatherData: function(data) {
        data.stopPropagation();
        data.preventDefault();
        var form = $(data.currentTarget);
        var array = form.serializeArray();
        console.log(array);
        this.model.buildAndExecuteQuery(array, form.attr("name"));
    },

    selectDisplay: function(data) {
        if(this.display)
            this.display=null;

        if(data.display == "dateHistogram") {
            this.display = new HistogramView({data:data, el:this.$("#results")});
        } else {
            this.display = new ListView({data:data, el:this.$("#results")});
        }
        this.$("footer").empty().append("<div>Prossesseringstid: " + data.took + "</div>");
    },

    displayError: function (string) {
        if(this.display)
            this.display=null;

        this.$("#results").empty().text(string);
    }

});