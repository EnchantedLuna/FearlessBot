const { EmbedBuilder } = require("discord.js");

const taylorSongsByAlbum = [
  {
    title: "Taylor Swift (Debut)",
    image: "https://i.imgur.com/w0bksSN.jpg",
    songs: [
      "Tim McGraw",
      "Picture to Burn",
      "Teardrops on My Guitar",
      "A Place in This World",
      "Cold As You",
      "The Outside",
      "Tied Together With a Smile",
      "Stay Beautiful",
      "Should've Said No",
      "Mary's Song",
      "Our Song",
      "I'm Only Me When I'm With You",
      "Invisible",
      "A Perfectly Good Heart",
    ],
  },
  {
    title: "Fearless (Taylor's Version)",
    image: "https://i.imgur.com/WenkW0I.jpg",
    songs: [
      "Jump Then Fall",
      "Untouchable",
      "Forever and Always (piano)",
      "Come In With The Rain",
      "Superstar",
      "The Other Side of the Door",
      "Fearless",
      "Fifteen",
      "Love Story",
      "White Horse",
      "You Belong With Me",
      "Breathe",
      "Tell Me Why",
      "You're Not Sorry",
      "The Way I Loved You",
      "Forever and Always",
      "The Best Day",
      "Change",
      "Today Was a Fairytale",
      "You All Over Me",
      "Mr. Perfectly Fine",
      "That's When",
      "Don't You",
      "Bye Bye Baby",
    ],
  },
  {
    title: "Speak Now (Taylor's Version)",
    image: "https://i.imgur.com/K8ZVgVV.jpg",
    songs: [
      "Mine",
      "Sparks Fly",
      "Back to December",
      "Speak Now",
      "Dear John",
      "Mean",
      "The Story of Us",
      "Never Grow Up",
      "Enchanted",
      "Better Than Revenge",
      "Innocent",
      "Haunted",
      "Last Kiss",
      "Long Live",
      "Ours",
      "If This Was A Movie",
      "Superman",
      "Electric Touch",
      "When Emma Falls in Love",
      "I Can See You",
      "Castles Crumbling",
      "Foolish One",
      "Timeless",
    ],
  },
  {
    title: "Red (Taylor's Version)",
    image: "https://i.imgur.com/0nUf20J.jpg",
    songs: [
      "State of Grace",
      "Red",
      "Treacherous",
      "I Knew You Were Trouble",
      "All Too Well",
      "22",
      "I Almost Do",
      "We Are Never Ever Getting Back Together",
      "Stay Stay Stay",
      "The Last Time",
      "Holy Ground",
      "Sad Beautiful Tragic",
      "The Lucky One",
      "Everything Has Changed",
      "Starlight",
      "Begin Again",
      "The Moment I Knew",
      "Come Back... Be Here",
      "Girl At Home",
      "Ronan",
      "Better Man",
      "Nothing New",
      "Babe",
      "Message In A Bottle",
      "I Bet You Think About Me",
      "Forever Winter",
      "Run",
      "The Very First Night",
      "All Too Well (10 Minute Version)",
    ],
  },
  {
    title: "1989 (Taylor's Version)",
    image: "https://i.imgur.com/6G6TlkC.png",
    songs: [
      "Welcome To New York",
      "Blank Space",
      "Style",
      "Out of the Woods",
      "All You Had To Do Was Stay",
      "Shake it Off",
      "I Wish You Would",
      "Bad Blood",
      "Wildest Dreams",
      "How You Get the Girl",
      "This Love",
      "I Know Places",
      "Clean",
      "Wonderland",
      "You Are In Love",
      "New Romantics",
      "Slut!",
      "Say Don't Go",
      "Now That We Don't Talk",
      "Suburban Legends",
      "Is It Over Now?",
      "Sweeter Than Fiction",
    ],
  },
  {
    title: "reputation",
    image: "https://i.imgur.com/o2v3b7E.jpg",
    songs: [
      "...Ready For It?",
      "End Game",
      "I Did Something Bad",
      "Don't Blame Me",
      "Delicate",
      "Look What You Made Me Do",
      "So It Goes...",
      "Gorgeous",
      "Getaway Car",
      "King of My Heart",
      "Dancing With Our Hands Tied",
      "Dress",
      "This Is Why We Can't Have Nice Things",
      "Call It What You Want",
      "New Year's Day",
    ],
  },
  {
    title: "Lover",
    image: "https://i.imgur.com/cNnUR0M.jpg",
    songs: [
      "I Forgot That You Existed",
      "Cruel Summer",
      "Lover",
      "The Man",
      "The Archer",
      "I Think He Knows",
      "Miss Americana & The Heartbreak Prince",
      "Paper Rings",
      "Cornelia Street",
      "Death By A Thousand Cuts",
      "London Boy",
      "Soon You'll Get Better",
      "False God",
      "You Need to Calm Down",
      "Afterglow",
      "ME!",
      "It's Nice to Have A Friend",
      "Daylight",
    ],
  },
  {
    title: "folklore",
    image: "https://i.imgur.com/oZvDEky.jpg",
    songs: [
      "the 1",
      "cardigan",
      "the last great american dynasty",
      "exile",
      "my tears ricochet",
      "mirrorball",
      "seven",
      "august",
      "this is me trying",
      "illicit affairs",
      "invisible string",
      "mad woman",
      "epiphany",
      "betty",
      "peace",
      "hoax",
      "the lakes",
    ],
  },
  {
    title: "evermore",
    image: "https://i.imgur.com/BiNIOXH.jpg",
    songs: [
      "willow",
      "champagne problems",
      "gold rush",
      "'tis the damn season",
      "tolerate it",
      "no body, no crime",
      "happiness",
      "dorothea",
      "coney island",
      "ivy",
      "cowboy like me",
      "long story short",
      "marjorie",
      "closure",
      "evermore",
      "right where you left me",
      "it's time to go",
    ],
  },
  {
    title: "Midnights",
    image:
      "https://upload.wikimedia.org/wikipedia/en/9/9f/Midnights_-_Taylor_Swift.png",
    songs: [
      "Lavender Haze",
      "Maroon",
      "Anti-Hero",
      "Snow on the Beach",
      "You're On Your Own, Kid",
      "Midnight Rain",
      "Question...?",
      "Vigilante Shit",
      "Bejeweled",
      "Labyrinth",
      "Karma",
      "Sweet Nothing",
      "Mastermind",
      "Hits Different",
      "The Great War",
      "Paris",
      "High Infidelity",
      "Glitch",
      "Would've, Could've, Should've",
      "Dear Reader",
    ],
  },
  {
    title: null,
    image: null,
    songs: [
      "I Heart ?",
      "Safe and Sound",
      "Eyes Open",
      "Only the Young",
      "Christmas Tree Farm",
      "All of the Girls You Loved Before",
    ],
  },
];

exports.run = function (message, args, bot, db) {
  let album =
    taylorSongsByAlbum[Math.floor(Math.random() * taylorSongsByAlbum.length)];
  let song = album.songs[Math.floor(Math.random() * album.songs.length)];
  let embed = new EmbedBuilder().setTitle("Random Song");
  let text = "You should listen to " + song;
  text += album.title !== null ? " from " + album.title + "." : ".";
  embed.setDescription(text);
  if (album.image !== null) {
    embed.setThumbnail(album.image);
  }
  message.channel.send({ embeds: [embed] });
};

exports.interaction = function (interaction, bot, db) {
  const selectedAlbum =
    interaction.options.getInteger("album") ??
    Math.floor(Math.random() * taylorSongsByAlbum.length);
  let album = taylorSongsByAlbum[selectedAlbum];
  let song = album.songs[Math.floor(Math.random() * album.songs.length)];
  let text = "You should listen to " + song;
  text += album.title !== null ? " from " + album.title + "." : ".";
  let songEmbed = new EmbedBuilder()
    .setTitle("Random Song")
    .setDescription(text.toString());
  if (album.image !== null) {
    songEmbed.setThumbnail(album.image);
  }
  interaction.reply({ embeds: [songEmbed] });
};
