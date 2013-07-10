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

    initialize: function (options) {
        this.render(options.data);
    },

    render: function (data) {
        this.el.append(this.template);
        this.buildHistogram(data.entries);
    },

    buildHistogram: function (dataSet) {

        function selectMonths(dataSet){
            var months = [];
            for (var month in dataSet) {
                months.push(dateFormat(dataSet[month].time, "mmm YY"));
            }
            return months;
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
                categories: selectMonths(dataSet)
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'NOK'
                },
                label: {
                    format: "{value:,.0f}"
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