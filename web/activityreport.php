<?php
require_once "config.php";
$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8mb4");

$bots = (isset($_GET['includebots'])) ? '' : "AND channel NOT IN ('132026417725702145','728532729398034462')";

$query = $db->prepare("SELECT year, month, message_count
FROM user_message_stats
WHERE guild=? AND user=? $bots
ORDER BY year, month");
$query->bind_param('ss', $_GET['server'], $_GET['user']);
$query->execute();
$query->bind_result($month, $year, $count);

$counts = array();
while ($query->fetch()) {
    $counts[$month."/".$year] += $count;
}

$query = $db->prepare("SELECT name, SUM(message_count) AS msgCount
FROM user_message_stats ums
JOIN channel_stats cs ON ums.guild=cs.server AND ums.channel=cs.channel
WHERE ums.guild = ? AND user = ? AND web=1 ORDER BY msgCount DESC
GROUP BY name
");
$query->bind_param('ss', $_GET['server'], $_GET['user']);
$query->execute();
$query->bind_result($channel, $messageCount);

$channelCounts = array();
while ($query->fetch()) {
    $channelCounts[$channel] = $messageCount;
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Activity Report</title>
    <!--Load the AJAX API-->
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.min.js"></script>
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
            data.addColumn('number', 'Messages');
            data.addRows([
                <?php
                foreach ($counts as $month => $amount) {
                    echo "['$month', $amount],";
                }
                ?>
            ]);

            // Set chart options
            var options = {'title':'Messages By Month <?php echo ($_GET['server']=='115332333745340416' && !isset($_GET['includebots'])) ? ' (excluding bots)' : ''; ?>'};

            // Instantiate and draw our chart, passing in some options.
            var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
            chart.draw(data, options);
        }
    </script>
</head>

<body>
<!--Div that will hold the pie chart-->
<div id="chart_div" style="width: 1000px;height:500px"></div>
<canvas id="myChart" width="700" height="500"></canvas>
<script>
    var data = {
        datasets: [{
            data: <?php echo json_encode(array_values($channelCounts)); ?>,
            backgroundColor: ['#b2cefe', '#a1836b', '#fea3aa', '#a55168', '#f8b88b', '#b19cd9', '#f47fff', '#F1C40F', '#7BE3BB', '#eacdd0']
        }],

        labels: <?php echo json_encode(array_keys($channelCounts));?>
    };
    var myDoughnutChart = new Chart('myChart', {
    type: 'doughnut',
    data: data,
    options: {responsive: false}
});
</script>
</body>
</html>
