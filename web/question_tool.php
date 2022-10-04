<?php
require_once "config.php";
$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8mb4");

$query = $db->prepare("SELECT * FROM trivia_questions WHERE web_key = ?");
$query->bind_param('s', $_REQUEST['key']);
$query->execute();
$result = $query->get_result();
$question = $result->fetch_assoc();

if (!$question) {
    die('invalid key');
}

$guild = PRIMARY_GUILD;
$query = $db->prepare("SELECT ta.id, ta.user, ta.answer, m.username, m.discriminator FROM trivia_answers ta
LEFT JOIN members m ON ta.user=m.id AND m.server={$guild}
WHERE questionid = ?");
$query->bind_param('i', intval($question['id']));
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
</head>
<body>
<div class="container">
    <div id="shitposts">
        <h1>Question: <?php echo $question['question']; ?></h1>
        <p>Status: <?php echo $question['isopen'] ? 'Open' : 'Closed' ?></p>
        <ul class="list-group">
        <?php
        foreach ($answers as $answer) {
            $username = $answer['username'] ? $answer['username'] . '#' . $answer['discriminator'] : 'ID ' . $answer['user'];
            echo "<li class='list-group-item'>";
            echo "<input class='form-check-input me-2' type='checkbox' value='{$answer['user']}' id='answer-{$answer['id']}'>";
            echo "<label class='form-check-label' for='answer-{$answer['id']}'><p class='mb-0'>{$username}</p><span class='small'>{$answer['answer']}</span></label>";
            echo "</li>";
        }
        ?>
        </ul>
    </div>
</div>

</body>
</html>

