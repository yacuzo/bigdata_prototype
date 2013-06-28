/**
 * Created with IntelliJ IDEA.
 * User: andre b. amundsen
 * Date: 6/27/13
 * Time: 1:31 PM
 * To change this template use File | Settings | File Templates.
 */

var ListView;
ListView = Simple.View.extend({
    //this.el = $()
    template: "",
    initialize: function(data) {
        this.render(data);
    },

    render: function(data) {
        console.log(data);
    }

});