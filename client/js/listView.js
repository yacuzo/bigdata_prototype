/**
 * Created with IntelliJ IDEA.
 * User: andre b. amundsen
 * Date: 6/27/13
 * Time: 1:31 PM
 * To change this template use File | Settings | File Templates.
 */

var ListView;
ListView = Simple.View.extend({
    currentPage : 1,
    totalHits: 0,
    hitsPerPage: 0,
    //this.el = $() set by simple via options
    template:
    '<table class="simpleTable">'+
        '<tr>' +
            '<th>Konto</th>' +
            '<th>Sum</th>' +
            '<th class="wide">Beskrivelse</th>' +
            '<th>Dato</th>' +
            '<th>Bokførings Dato</th>' +
            '<th>Transaksjon type</th>' +
            '<th>Id</th>' +
        '</tr>' +
    '</ul>',

    pagingTemplate :
        '<div class="pagingContainer">' +
            '<button id="prevPage" class="pagingButton">Forrige</button>' +
            '<button id="nextPage" class="pagingButton">Neste</button>' +
        '</div>',

    initialize: function(options) {
        this.render(options.data);
        Simple.events.on("list:displayNextPage", this.displayNextPage, this);
    },

    events: {
        "click #nextPage" : "nextPage",
        "click #prevPage" : "prevPage"
    },

    render: function(data) {
        this.el.empty().append(this.template);


        var table = this.$("table");
        table.attr("name", this.currentPage);

        for(var hit in data.hits) {
            var row = this.makeHTMLTableRow(data.hits[hit]);
            table.append(row);
        }

        if (data.hits.length < data.totalHits) {
            this.el.append(this.pagingTemplate);
            this.totalHits = data.totalHits;
        }
        this.hitsPerPage = data.hits.length;
    },

    makeHTMLTableRow: function (hit) {
        var date = new Date(hit.date);
        var bokDate = new Date(hit.bokforingDate);
        var html = "<tr>";
        html += '<td>'+hit.accountNumber+'</td>';
        html += '<td>'+hit.amount+'</td>';
        html += '<td>'+hit.description+'</td>';
        html += '<td>'+date.toLocaleDateString()+'</td>';
        html += '<td>'+bokDate.toLocaleDateString()+'</td>';
        html += '<td>'+hit.transactionCode+'</td>';
        html += '<td>'+hit.id+'</td>';
        html += "</tr>";
        return html;
    },

    nextPage: function () {
        if (this.currentPage * this.hitsPerPage < this.totalHits) {
            var pageToShow = this.$("table[name='" + (this.currentPage +1) + "']");
            if (pageToShow.length > 0) {
                pageToShow.prev().hide();
                pageToShow.show();
            }else
                Simple.events.trigger("list:getNextPage", {page:this.currentPage, perPage: this.hitsPerPage});
        }
        return false;//to stop propagation
    },

    displayNextPage: function (data) {
        var newPage = $(this.template);
        for(var hit in data.hits) {
            var row = this.makeHTMLTableRow(data.hits[hit]);
            newPage.append(row);
        }

        var pageToHide = this.$("table[name='" + (this.currentPage) + "']");
        pageToHide.hide().after(newPage);

        this.currentPage++;
        newPage.attr("name", this.currentPage);
        $("footer").empty().append("<div>Prossesseringstid: " + data.took + "</div>");
    },

    prevPage: function () {
        console.log("Trying prev page!");
        if (this.currentPage > 1) {
            var pageToShow = this.$("table[name='" + (this.currentPage -1) + "']");
            pageToShow.next().hide();
            pageToShow.show();
            this.currentPage--;
        }
        return false;
    }

});