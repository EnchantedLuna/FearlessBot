<?php
require_once "config.php";
$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8mb4");

$query = $db->prepare("SELECT MONTH(messages.date) month, YEAR(messages.date) year, channel_stats.name cname, COUNT(id) total FROM messages
  JOIN channel_stats ON messages.channel=channel_stats.channel
  WHERE messages.server = ? AND web = 1
  GROUP BY year, month, cname
  ORDER BY year, month, cname");
$query->bind_param('s', $_GET['server']);
$query->execute();
$query->bind_result($month, $year, $channel, $count);
$stats = array();
$channels = array();
while ($query->fetch()) {
    $stats[$month.'/'.$year][$channel] = $count;
    $channels[$channel] = $channel;
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Activity Report</title>
    <!--Load the AJAX API-->
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <script type="text/javascript">

        // Load the Visualization API and the piechart package.
        google.load('visualization', '1.0', {'packages':['corechart','bar']});

        // Set a callback to run when the Google Visualization API is loaded.
        google.setOnLoadCallback(drawChart);

        // Callback that creates and populates a data table,
        // instantiates the pie chart, passes in the data and
        // draws it.
        function drawChart() {

            // Create the data table.
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Month');
            <?php
            foreach ($channels as $c) {
                echo 'data.addColumn(\'number\', \''.$c.'\');';
            }
            ?>
            data.addRows([
                <?php
                foreach ($stats as $month => $channel) {
                    $row = '[\''.$month.'\'';
                    foreach ($channels as $cname) {
                        $row .= ','.$channel[$cname];
                    }
                    $row .= '],';
                    echo $row;
                }
                ?>
            ]);

            // Set chart options
            var options = {'title':'Messages By Month'};

            // Instantiate and draw our chart, passing in some options.
            var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
            chart.draw(data, options);
        }
    </script>
</head>

<body>
<!--Div that will hold the pie chart-->
<div id="chart_div" style="width: 800px;height:400px"></div>
</body>
</html>
