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
                    '<input class="calendar" id="from" name="from" type="date">  </input>' +
                    '<input class="calendar" id="to" name="to" type="date">  </input>' +
                    '<input id="text" name="fullDescription" type="search"/>' +
                    '<select id="accounts" name="accountNumber"><option value="base">Select account</option></select>' +
                    '<input id="submit" type="submit"/>' +
                '</form>' +
                '<div id="results"></div>',

    initialize: function(options) {//constructor
        this.render();
        this.model = options.model;
        this.model.on("GET:done", this.selectDisplay, this);
    },
    events: {
        "submit .input":"gatherData"//,
        //"submit #submit":"submitData"
    }, //lytte på dom events

    render: function () {
        this.el.append(this.template);
        this.fillAccountList();
    },

    fillAccountList: function () {
        $.getJSON("textdata/accounts.json", function(data) {

            for (var obj in data) {
                $("#accounts").append("<option value='" + data[obj].account + "'>" + data[obj].account + "</option>")
            }

        });
    },

    gatherData: function(data) {
        data.stopPropagation();
        data.preventDefault();
        var array = $(data.currentTarget).serializeArray();
        console.log(array);
        this.model.buildAndExecuteQuery(array);
    },

    selectDisplay: function(data) {
        if(this.display)
            this.display=null;

        console.log(data);
        this.display = new ListView({data:data, el:this.$("#results")});
    }

});