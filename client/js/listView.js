/**
 * Created with IntelliJ IDEA.
 * User: andre b. amundsen
 * Date: 6/27/13
 * Time: 1:31 PM
 * To change this template use File | Settings | File Templates.
 */

var ListView;
ListView = Simple.View.extend({
    //this.el = $() set by simple via options
    template:
    '<table class="simpleTable">'+
        '<tr>' +
            '<th>Konto</th>' +
            '<th>Sum</th>' +
            '<th>Beskrivelse</th>' +
            '<th>Full Beskrivelse</th>' +
            '<th>Dato</th>' +
            '<th>Bokførings Dato</th>' +
            '<th>Transaksjon type</th>' +
            '<th>Id</th>' +
        '</tr>' +
    '</ul>',

    initialize: function(options) {
        this.render(options.data);
    },

    render: function(data) {
        this.el.empty().append(this.template);

        var table = this.$("table");

        for(var hit in data.hits) {
            var row = this.makeHTMLTableRow(data.hits[hit]);
            table.append(row);
        }
    },

    makeHTMLTableRow: function (hit) {
        var date = new Date(hit.date);
        var bokDate = new Date(hit.bokforingDate);
        var html = "<tr>";
        html += '<td>'+hit.accountNumber+'</td>';
        html += '<td>'+hit.amount+'</td>';
        html += '<td>'+hit.description+'</td>';
        html += '<td>'+hit.fullDescription+'</td>';
        html += '<td>'+date.toLocaleDateString()+'</td>';
        html += '<td>'+bokDate.toLocaleDateString()+'</td>';
        html += '<td>'+hit.transactionCodeText+'</td>';
        html += '<td>'+hit.id+'</td>';
        html += "</tr>";
        return html;
    }

});