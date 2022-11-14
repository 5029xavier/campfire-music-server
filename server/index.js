const express = require('express');
// const axios = require('axios');
// const AWS = require('aws-sdk');
const CronJob = require('cron').CronJob;
const bodyParser = require('body-parser');
const SpotifyWebApi = require('spotify-web-api-node');
const spotifyclient = require('./clientkeys.js');
const keys = require('../awsS3.js');
const info = require('../artists.js');
const { mongoURI } = require('../config.js');
const Mongoose = require('mongoose');
const { Song, Album, Artist } = require('./models.js');
const slug = require('mongoose-slug-generator');
const test = require('../test.js');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const spotifyApi = new SpotifyWebApi({
    clientId: spotifyclient.id,
    clientSecret: spotifyclient.secret,
});

const artists = [];

const getArtist = async (artistId) => {
    return await spotifyApi.getArtist(artistId)
    .then(data => {
        let artist = data.body;
        let info = {
            id: artist.id,
            name: artist.name,
            spotify_link: artist.external_urls.spotify,
            photo_url: artist.images[1].url,
            genres: artist.genres,
            albums: []
        }
        return info;
    })
    .then(artist => {
        return getAlbums(artist.id, artist)
    })
    .catch(err => {
        console.log(err)
    })
}

const populateArtists = async () => {
    for (let i = 0; i<info.artists.length; i++) {
       await getArtist(info.artists[i].id)
       .then(artist => {
           artists.push(artist);
       })
       .catch(err => {
           console.log(err);
       });
    };
    return artists;
}

const getAlbums = async (artistId, artist) => {
    return await spotifyApi.getArtistAlbums(artistId, {include_groups: 'album,single', limit: '50'})
    .then(data => {
        let seen = {};
        for (let i = 0; i<data.body.items.length; i++) {
            let album = data.body.items[i];
            if (!album.name.includes('(Deluxe)') && !album.name.includes(`(Int'l Version)`) && !album.name.includes('(Explicit Deluxe)')) {
                if (!seen[album.name]) {
                    if (album.artists[0].id === artistId) {
                        let albuminfo = {
                            id: album.id,
                            name: album.name,
                            type: album.album_type,
                            artist_id: artistId,
                            photo_url: album.images[1].url,
                            spotify_link: album.external_urls.spotify,
                            date: album.release_date,
                            songs: []
                        }
                        console.log(albuminfo.name);
                        artist.albums.push(albuminfo)
                        seen[album.name] = true;
                    }
                }
            }
        }
        return artist;
    })
    .then(artist => {
        return populateAlbumSongs(artist);
    })
    .catch(err => {
        console.log(err);
    })
};

const getSongs = async (albumId, artist, i) => {
    return await spotifyApi.getAlbumTracks(albumId)
    .then(data => {
        // console.log(data.body.items);
        let songs = data.body.items;
        songs.map(song => {
            let info = {
                id: song.id,
                name: song.name,
                spotify_link: song.external_urls.spotify,
                album: albumId,
                views: 0,
            }
            artist.albums[i].songs.push(info)
        })
        return artist
    })
    .catch(err => {
        console.log(err);
    });
}

const populateAlbumSongs = async (artist) => {
    for (let i = 0; i<artist.albums.length; i++) {
       await getSongs(artist.albums[i].id, artist, i);
    };
    return artist;
}

// () => {Mongoose.connection.db.dropDatabase();}

Mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }, () => { console.log('connected')} )
Mongoose.plugin(slug);

const createArtist = async (artist) => {
    let artistInfo = new Artist({
        name: artist.name,
        spotify_link: artist.spotify_link,
        photo_url: artist.photo_url,
        date: artist.date,
        genres: artist.genres
    })
    await artistInfo.save()
    .then(artistInfo => {
        artist.albums.map(album => {
            createAlbum(artistInfo, album)
        })
    })
    .catch(err => {
        if (err) console.log(err)
    })
}    

const createAlbum = async (artistInfo, album) => {
    let albumInfo = new Album({
        name: album.name,
        type: album.type,
        artist: artistInfo._id,
        artist_slug: artistInfo.slug,
        photo_url: album.photo_url,
        date: album.date,
    })
    await albumInfo.save()
    .then(albumInfo => {
        album.songs.map(song => {
            createSong(albumInfo, song)
        })
    })
    .catch(err => {
        if (err) console.log(err)
    })
}

const createSong = async (albumInfo, song) => {
    let songInfo = new Song({
        name: song.name,
        artists: [albumInfo.artist],
        artist_slugs: [albumInfo.artist_slug],
        id: song.id,
        spotify_link: song.spotify_link,
        photo_url: albumInfo.photo_url,
        album: albumInfo._id,
        album_slug: albumInfo.slug,
        views: 0,
        date: albumInfo.date
    })
    await songInfo.save()
    .catch(err => {
        if (err) console.log(err)
    })
}

const createModels = (artists) => {
    artists.map(artist => {
        createArtist(artist);
    })
}

const update = async function() {
    spotifyApi.clientCredentialsGrant()
    .then(data => {
        console.log('The access token is ' + data.body['access_token']);
        console.log('The access token expires in ' + data.body['expires_in']);
        spotifyApi.setAccessToken(data.body['access_token']);
    })
    .then(() => {
        return populateArtists();
        // return getArtist(info.artists[0].id);
        // return getAlbums(info.artists[0].id, artists)
    })
    .then(artists => {
        // console.log(artists);
        return createModels(artists);
    })
    .then(songs => {
        console.log(songs);
    })
    .catch(err => {
        console.log(err);
    })
};

update();



app.listen(3000, function() {
    console.log('listening on port 3000');
})    
    
// let job = new CronJob('0 * * * * *', getShows(), null, true, 'America/Los_Angeles');
// job.start();

