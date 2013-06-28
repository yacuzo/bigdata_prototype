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
    template :  '<form class="input">' +
                    '<input class="calendar" id="from" type="date">  </input>' +
                    '<input class="calendar" id="to" type="date">  </input>' +
                    '<input type="search"/>' +
                    '<select id="accounts"><option value="base">Select account</option></select>' +
                    '<input type="submit"/>' +
                '</form>' +
                '<div id="results"></div>',

    initialize: function(options) {//constructor
        this.render();
    },
    events: {
        "submit #input":"submitData"
    }, //lytte på dom events

    render: function () {
        this.el.append(this.template);
        this.fillAccountList();
    },

    fillAccountList: function () {
        $.getJSON("textdata/accounts.json", function(data) {

            for (obj in data) {
                console.log(obj);
                $("#accounts").append("<option value='" + data[obj].account + "'>" + data[obj].account + "</option>")
            }

        });
    },

    submitData: function(data) {
        console.log(data);
        return false;
    }

});