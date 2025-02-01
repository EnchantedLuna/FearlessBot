<?php
require_once "config.php";
$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8mb4");

$hideSelections = isset($_GET['hide']);
$query = $db->prepare("SELECT * FROM trivia_questions WHERE web_key = ?");
$query->bind_param('s', $_REQUEST['key']);
$query->execute();
$result = $query->get_result();
$question = $result->fetch_assoc();

if (!$question) {
    die('invalid key');
}

$guild = PRIMARY_GUILD;
$sort = $_REQUEST['sort_key'] == 'time' ? 'ta.time' : 'ta.id'; 
$query = $db->prepare("SELECT ta.id, ta.user, ta.answer, ta.time, m.username, m.discriminator FROM trivia_answers ta
LEFT JOIN members m ON ta.user=m.id AND m.server=?
WHERE questionid = ?
ORDER BY $sort");
$query->bind_param('si', $guild, $question['id']);
$query->execute();
$result = $query->get_result();

$answers = [];
while ($answer = $result->fetch_assoc()) {
    $answers[] = $answer;
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Question Tool</title>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <link rel="stylesheet" type="text/css" href="bootstrap.min.css"/>
    <script src="https://code.jquery.com/jquery-3.6.1.min.js"></script>
</head>
<body>
<div class="container">
    <div id="question-tool">
        <h1>Question #<?php echo $question['id'] . ": " . $question['question']; ?></h1>
        <p>Status: <?php echo $question['isopen'] ? 'Open' : 'Closed' ?></p>
        <?php
        if ($sort == 'ta.time') {
            echo "<p>Currently sorted by <b>last modified time</b>.";
            echo "<p><a href='question_tool.php?key=".urlencode($_REQUEST['key'])."'>Sort by original submission time?</a></p>";
        } else {
            echo "<p>Currently sorted by <b>original submission time</b>.";
            echo "<p><a href='question_tool.php?key=".urlencode($_REQUEST['key'])."&amp;sort_key=time'>Sort by last modified time?</a></p>";
        }
        ?>
        <p>Total answers: <?php echo count($answers); ?></p>
        <?php if (!$hideSelections): ?>
        <p><input type="checkbox" id="select-all"> <label for="select-all"> Select All</p>
        <?php endif; ?>
        <ul class="list-group">
        <?php
        foreach ($answers as $answer) {
            $username = $answer['username'] ? $answer['username'] : 'ID ' . $answer['user'];
            $username = htmlspecialchars($username);
            $timestamp = $answer['time'];
            echo "<li class='list-group-item'>";
            if (!$hideSelections) {
                echo "<input class='form-check-input me-2 check-answer' type='checkbox' value='{$answer['user']}' id='answer-{$answer['id']}'>";
            }
            $escapedAnswer = htmlspecialchars($answer['answer']);
            echo "<label class='form-check-label' for='answer-{$answer['id']}'><p class='mb-0'>{$username} - {$timestamp}</p><span class='small'>{$escapedAnswer}</span></label>";
            echo "</li>";
        }
        ?>
        </ul>
        <?php if (!$hideSelections): ?>
        <p>Number selected: <span id='selected-count'>0</span></p>
        <div class='mt-2'><textarea rows="6" style="width:100%" id="result-box"></textarea></div>
        <?php endif; ?>
    </div>
</div>
<script>
$(document).ready(function() {
    $('#select-all').click(function(event) {   
        if(this.checked) {
            $(':checkbox').each(function() {
                this.checked = true;                        
            });
        } else {
            $(':checkbox').each(function() {
                this.checked = false;                       
            });
        }
    });
    $('.check-answer, #select-all').click(function() {
        let selected = [];
        $('.form-check-input:checked').each(function() {
            selected.push("<@" + $(this).val() + ">");
        });
        $('#selected-count').text(selected.length)
        $('#result-box').val(selected.join(" "));
    });
}); 
</script>
</body>
</html>

