module.exports = {
    dummyData: [
        {
            id: '1',
            name: 'Drake',
            spotify_link: 'spotify.com',
            photo_url: 'google.com',
            genres: ['R&B', 'hip hop'],
            albums: [
                { 
                    id: '2',
                    name: 'Views',
                    artist_id: '1',
                    photo_url: 'google.com',
                    date: '2020-08-12',
                    songs: [
                        {
                            id: '3',
                            name: 'Grammys',
                            spotify_link: 'spotify.com',
                            album: '2',
                            views: 0,
                        }
                    ]
                }
        ]
        }
    ]    
}