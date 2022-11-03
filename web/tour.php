<?php
require_once "config.php";
$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8mb4");

$query = $db->prepare("SELECT * FROM trivia_questions WHERE user='115329261350420487' AND question LIKE 'Eras Tour%'");
$query->execute();
$result = $query->get_result();

$questions = [];
$ids = [];
while ($question = $result->fetch_assoc()) {
    $ids[] = $question['id'];
    $questions[] = $question;
}

$users = [];
if (!empty($ids)) {
    $guild = PRIMARY_GUILD;
    $query = $db->prepare("SELECT ta.id, ta.user, ta.answer, ta.time, m.username, m.discriminator, ta.questionid FROM trivia_answers ta
    LEFT JOIN members m ON ta.user=m.id AND m.server=?
    WHERE questionid IN (" . implode(",",$ids) . ")
    ORDER BY ta.id");
    $query->bind_param('s', $guild);
    $query->execute();
    $result = $query->get_result();
    
    while ($answer = $result->fetch_assoc()) {
        if ($answer['username']) {
            $users[$answer['questionid']][] = $answer['username'] . "#" . $answer['discriminator'];
        }
    }
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Eras Tour</title>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <link rel="stylesheet" type="text/css" href="bootstrap.min.css"/>
    <script src="https://code.jquery.com/jquery-3.6.1.min.js"></script>
</head>
<body>
<div class="container">
    <div id="question-tool">
        <h1>Eras Tour</h1>
        <ul class="list-group">
        <?php
        foreach ($questions as $question) {
            echo "<li class='list-group-item'>";
            $title = htmlspecialchars($question['question']);
            $key = $question['web_key'];
            $userList = htmlspecialchars(implode(", ",$users[$question['id']]));
            echo "<p class='mb-0'><a href='question_tool.php?key={$key}&amp;hide'>{$question['id']}: {$title}</a></p><span class='small'>{$userList}</span>";
            echo "</li>";
        }
        ?>
        </ul>
    </div>
</div>
</body>
</html>