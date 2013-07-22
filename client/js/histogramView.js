/**
 * Created with IntelliJ IDEA.
 * User: andre b. amundsen
 * Date: 08/07-13
 * Time: 12:42
 * To change this template use File | Settings | File Templates.
 */


var HistogramView;
HistogramView = Simple.View.extend({
    template: '<div id=chart></div>',
    categories : [
        "Minibank", "Kiosk", "Dagligvarer",
        "Mat", "Idrettsutstyr", "Bil",
        "Hus", "Klær og sko", "Elektronikk",
        "Fritid", "Reise", "Underholdning",
        "Uteliv", "Diverse 1", "Diverse 2",
        "Diverse 3", "Diverse 4", "Diverse 5",
        "Diverse 6", "Diverse 7", "Diverse 8",
        "Diverse 9", "Diverse 10", "Diverse 11",
        "Diverse 12", "Diverse 13", "Diverse 14"],

    initialize: function (options) {
        this.render(options.data);
    },

    render: function (data) {
        this.el.append(this.template);
        this.buildHistogram(data.entries, data.interval);
    },

    buildHistogram: function (dataSet, interval) {

        function selectInterval(dataSet, interval, categories){
            var intervalFormat;
            var intervals = [];
            switch (interval){
                case "month":
                    intervalFormat = "mmm yy";
                    break;
                case "day":
                    intervalFormat = "dd\nmmm";
                    break;
                case "week":
                    intervalFormat = "'Uke xx' mmm yy";
                    break;
                case "category":
                    for (var category in dataSet)
                            intervals.push(categories[dataSet[category].term]);
                    return intervals;
            }
            for (var item in dataSet) {
                intervals.push(dateFormat(dataSet[item].time, intervalFormat));
            }
            return intervals;
        }

        function getTotals (dataSet) {
            var totals = [];
            for (var total in dataSet) {
                totals.push(dataSet[total].total);
            }
            return totals;
        }
        console.log(getTotals(dataSet));
        $('#chart').highcharts({
            chart: {
                type: 'column'
            },
            title: {
                text: 'Sum Inn/Ut per Måned'
            },
            subtitle: {
                text: 'SB1'
            },
            xAxis: {
                categories: selectInterval(dataSet, interval, this.categories)
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'NOK'
                },
                label: {
                    formatter: function() {
                        if (this.value < 1000000000) {
                            return this.value;
                        } else {
                            return this.value / 1000000000 + "mrd";
                        }
                    }
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y:,.2f} NOK</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            series: [{
                name: 'Konto',
                data: getTotals(dataSet)
            }]
        });
    }
});