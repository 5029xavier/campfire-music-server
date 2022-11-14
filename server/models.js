const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const songSchema = mongoose.Schema({
  name: String,
  slug: { type: String, slug: ["name", "album_slug"], slug_padding_size: 2, unique: true },
  spotify_link: String,
  
  artist_slugs: [String],
  artists: [{ type: mongoose.Schema.ObjectId, ref: 'artist' }],
  album_slug: String,
  album: { type: mongoose.Schema.ObjectId, ref: 'album' },

  views: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
});

const artistSchema = mongoose.Schema({
    name: String,
    slug: { type: String, slug: ["name"], unique: true },
    spotify_link: String,
    photo_url: String,
    date: { type: Date, default: Date.now },
    genres: [String]
});

const albumSchema = mongoose.Schema({
    name: String,
    slug: { type: String, slug: ["name"], unique: true },
    type: String,
    spotify_link: String,
    photo_url: String,
    artist_slug: String,
    artist: { type: mongoose.Schema.ObjectId, ref: 'artist' },
    date: { type: Date, default: Date.now },
});

const Song = mongoose.model('song', songSchema);
const Artist = mongoose.model('artist', artistSchema);
const Album = mongoose.model('album', albumSchema);

module.exports = { Song, Artist, Album }