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
    template :
        '<div id="searchTabs">' +
            '<ul>'+
                '<li><a href="#searchType-1"><span>Enkelt søk</span></a></li>' +
                '<li><a href="#searchType-2"><span>Tidsaggregering</span></a></li>' +
                '<li><a href="#searchType-3"><span>Kategoriaggregering</span></a></li>' +
            '</ul>' +
            '<form class="simpleSearch" id="searchType-1" name="basic">' +
                '<div class="inputContainer">' +
                    '<label>From date:</label>' +
                    '<input class="calendar" name="from" type="date" min="2008-01-01" max="2010-12-31"/>' +
                '<label>To date:</label>' +
                    '<input class="calendar" name="to" type="date" min="2008-01-01" max="2010-12-31"/>' +
                '</div>' +
                '<div class="freeText">' +
                    '<label>Fritekstsøk:</label>' +
                    '<select name="searchField">' +
                        '<option value="description">Beskrivelse</option>' +
                    '</select>' +
                    '<input class="textInput" id="text" name="freeText" type="search" placeholder="Søketekst"/>' +
                '</div>' +
                '<select class="multiSelect" id="accounts" name="accountNumber" multiple="multiple"></select>' +
                '<div class="numHitsContainer">' +
                    '<label>Antall treff per side: </label>'+
                    '<input class="numberInput" name="size" type="number" placeholder="10" max="100" min="0"/>' +
                '</div>' +
                '<input id="submit" type="submit"/>' +
            '</form>' +
            '<form class="simpleSearch" id="searchType-2" name="time-aggregated">' +
                '<div class="inputContainer">' +
                    '<label>From date:</label>' +
                    '<input class="calendar" name="from" type="date" min="2008-01-01" max="2010-12-31"/>' +
                    '<label>To date:</label>' +
                    '<input class="calendar" name="to" type="date" min="2008-01-01" max="2010-12-31"/>' +
                '</div>' +
                '<select id="interval" name="interval">' +
                    '<option value="month">Måned</option>' +
                    '<option value="week">Uke</option> ' +
                    '<option value="day">Dag</option>' +
                '</select>'+
                '<select id="direction" name="direction">' +
                    '<option value="sum">Sum</option>' +
                    '<option value="in">Inntekter</option>' +
                    '<option value="out">Utgifter</option>' +
                '</select>' +
                '<select multiple="multiple" class="multiSelect" id="accounts2" name="accountNumber"></select>' +
                '<input id="submit" type="submit"/>' +
            '</form>' +
            '<form class="simpleSearch" id="searchType-3" name="category-aggregated">' +
                '<div class="inputContainer">' +
                    '<label>From date:</label>' +
                    '<input class="calendar" name="from" type="date" min="2008-01-01" max="2010-12-31"/>' +
                    '<label>To date:</label>' +
                    '<input class="calendar" name="to" type="date" min="2008-01-01" max="2010-12-31"/>' +
                '</div>' +
                '<select multiple="multiple" class="multiSelect" id="accounts2" name="accountNumber"></select>' +
                '<input id="submit" type="submit"/>' +
            '</form>' +
        '</div>' +
        '<div id="results" class="ui-widget ui-corner-all ui-widget-content"></div>' +
        '<footer></footer>',

    initialize: function(options) {//constructor
        this.render();
        this.model = options.model;
        this.model.on("SEARCH:done", this.selectDisplay, this);
        Simple.events.on("ERROR:display", this.displayError, this);
        this.model.on("SEARCH:started", this.showLoader, this);
    },
    events: {
        "submit #searchType-1":"gatherData",
        "submit #searchType-2":"gatherData",
        "submit #searchType-3":"gatherData"
    }, //lytte på dom events

    render: function () {
        this.el.append(this.template);
        this.fillAccountList();
        this.$("#searchTabs").tabs();
    },

    fillAccountList: function () {
        $.getJSON("textdata/accounts.json", function(data) {

            for (var obj in data)
                { //noinspection JSUnfilteredForInLoop
                    $("#accounts, #accounts2")
                                        .append("<option value='" + data[obj].account + "'>" + data[obj].account + "</option>")
                }

        });
    },

    gatherData: function(data) {
        data.stopPropagation();
        data.preventDefault();
        var form = $(data.currentTarget);
        var array = form.serializeArray();
        console.log(array); //DEBUG
        this.model.buildAndExecuteQuery(array, form.attr("name"));
    },

    selectDisplay: function(data) {
        if(this.display) {
            this.display=null;
        }

        this.$("#results").empty().off("click");

        var footer = this.$("footer").empty();
        if(data.display == "histogram") {
            this.display = new HistogramView({data:data, el:this.$("#results")});
        } else {
            this.display = new ListView({data:data, el:this.$("#results")});
            footer.append("<span class='footerEntry'>Antall treff: " + data.totalHits + "</span>");
        }
        footer.prepend("<span class='footerEntry'>Prossesseringstid: " + data.took + "</span>");
    },

    displayError: function (string) {
        if(this.display)
            this.display=null;

        this.$("#results").empty().text(string);
    },

    showLoader: function () {
        var loader = '<img id="ajaxLoader" src="resources/ajax-loader.gif" />';
        this.$("#results").empty().append(loader);
    }

});