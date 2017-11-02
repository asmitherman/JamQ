import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Content } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { OAuth as OAuthWeb } from 'oauthio-web';
import { OAuth } from 'oauth-phonegap';
import { Platform } from 'ionic-angular';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';



/**
 * Generated class for the SearchPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-search',
  templateUrl: 'search.html',
})

export class SearchPage {
  spotifyApi: any;
  songs: FirebaseListObservable<any>;
  key: any;
  isMobile: any;
  that: this;
  spotify: any;
  searchbar: any;


  constructor(
    public platform: Platform, public navCtrl: NavController,
    public navParams: NavParams, public af: AngularFireDatabase) {
      //checks if device is mobile or Web
    if (platform.is('cordova')) { this.isMobile = true; }
      else { this.isMobile = false; }

      var partyKey = sessionStorage['partyCookie'];
      //console.log(partyKey);
      this.songs = af.list("/" + partyKey + "/songlist");

      //getting spotify api library
      var SpotifyWebApi = require('spotify-web-api-node');
      //build api with no params
      this.spotifyApi = new SpotifyWebApi();

      //switches Auth method based on if mobile or web
      if (this.isMobile) {
        //is phone
        //gets auth from cache named 'spotify'
        this.spotify = OAuth.create('spotify');
      } else {
        //is web
        //gets auth from cache named 'spotify'
        this.spotify = OAuthWeb.create('spotify');
        console.log("is Web");
      }
      //sets access token of authenticated user
      this.spotifyApi.setAccessToken(this.spotify.access_token);
  }

  getItems(ev: any, that ) {
    document.getElementById("list").style.visibility = "visible";

    //gets the list that displays songs
    var mydiv = document.getElementById('list');

    // set val to the value of the searchbar
    let queryTerm = ev.target.value;
    // if the value is an empty string don't filter the items
    if (queryTerm && queryTerm.trim() != '') {
    //search track titles and return top 10 results
    var prev = this.spotifyApi.searchTracks(queryTerm, {limit: 10})
        .then(function(data, that) {
          //song object for easier calls
          let song = data.body.tracks;
          // clean the promise so it doesn't call abort
          prev = null;

          //for loop that iterates through the 10 songs returned from api
          //sends html for each one to page
          for(var i = 0; i < 10; i++)
          {
            //checks if element exists
            if(!song.items[i]) {
               continue;
            }

            i.toString();
            //artist name
            document.getElementById('artist' + i ).innerHTML = song.items[i].artists['0'].name;
            //album cover
            document.getElementById('img' + i ).setAttribute('src', song.items[i].album.images[0].url);
            //song title
            var title = document.getElementById('title' + i );
            title.innerHTML = song.items[i].name;
            //pass track id to page
            title.setAttribute("data-songid", song.items[i].id);
          }
        }, function(err) { //some error checking
          console.error(err);
        })
    }
  }

  ionViewDidLoad() {
    if (this.spotify.access_token) {
      //do something here? or dont.
    }
    else {
      let searchpage = document.getElementById('searchpage');
      let everything = document.getElementById('everything');
      this.searchbar = everything;
      // let addSpotify = document.getElementById('addSpotify');
      everything.parentNode.removeChild(everything);
      // searchpage.style.backgroundColor = 'grey';
      let img = document.createElement('img');
      img.setAttribute('src','https://static1.squarespace.com/static/551ed270e4b07f2b9a28489c/t/59848e13f7e0ab6f61df1b05/1501859351405/');
      img.style.alignContent = 'center';
      img.style.height = '50px';
      img.style.width = '50px';
      var spotifyauth = this.spotifyLogin.bind(this)
      img.onclick = spotifyauth;
      // img.setAttribute('onclick','this.spotifyLogin()');
      searchpage.replaceChild(img,searchpage.childNodes[0]);
    }
    console.log('ionViewDidLoad SearchPage');
  }

  spotifyLogin() {
    let searchpage = document.getElementById('searchpage');

    if (this.isMobile == true) {
      //is phone
      this.mobileAuth();
      searchpage.replaceChild(this.searchbar,searchpage.childNodes[0])

    } else {
      //is web
      this.webAuth();
      searchpage.replaceChild(this.searchbar,searchpage.childNodes[0])
    }

  }

  itemTapped(index) {
    //get songid from song clicked
    var id = document.getElementById('title'+index).getAttribute("data-songid");
    //move songlist to loval variable
    var db = this.songs;
    //call spotify api for song information
        this.spotifyApi.getTrack(id)
          .then(function(data) {
            //shorten call
            let track = data.body;
            //send track information to firebase
            db.push({
              artist: track.artists['0'].name,
              title: track.name,
              songid: id,
              img: track.album.images['0'].url,

              //maybe make a new table with likes columns of users who liked it and new table of users who disliked it
              likes: 1,// change to spotify users
              dislikes: 0 // change to spotify users
            });

        }, function(err) { //error checking
        console.log('Something went wrong!', err);
    });
  }

  //use for authentiating with mobile libraries
mobileAuth(){
  //initializes spotify auth
  OAuth.initialize('NJG7cpjPQHkVhSQgvpQi5MRoyM4');
  //popup for spotify login
  //then resets html to wait for auth to complete
    //idealy this would be a loading feature to wait until popup closes with success
  //on error sends alert  to page for debbuging
  let spotifyApi = this.spotifyApi;
    OAuth.popup('spotify',{cache: true}).done(function(spotify) {
      spotifyApi.setAccessToken(spotify.access_token);
    }).then(     ).fail(function(err) {
      alert("Error with spotify login");
    });

}

//use for authenticating with web libraries
webAuth() {
  var spotify = OAuthWeb.create('spotify');
  if(spotify.access_token){
    // console.log(spotify.access_token);

  } else {
  OAuthWeb.initialize('NJG7cpjPQHkVhSQgvpQi5MRoyM4');
    //popup for spotify login
    //then resets html to wait for auth to complete
      //idealy this would be a loading feature to wait until popup closes with success
    //on error sends alert  to page for debbuging
    let spotifyApi = this.spotifyApi;
      OAuthWeb.popup('spotify',{cache: true}).done(function(spotify) {
        spotifyApi.setAccessToken(spotify.access_token);
      }).then(       ).fail(function(err) {
        alert("Error with spotify login");
      });
    }

}

}
