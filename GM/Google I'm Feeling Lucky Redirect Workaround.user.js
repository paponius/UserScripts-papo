// ==UserScript==
// @name         Google I'm Feeling Lucky Redirect Workaround
// @namespace    https://github.com/paponius/papo-userscripts/
// namespace-was http://qria.net/
// @version      0.2
// @description  Immediately redirects when google prompts 'redirection notice'. Used to circumvent google pestering you when querying with I'm Feeling Lucky feature.
// @author       paponius (mod from Qria)
// @include      https://www.google.com/url?*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function getJsonFromUrl() {
        // From: https://stackoverflow.com/a/8486188
        const url = location.search;
        const query = url.substr(1);
        const result = {};
        query.split("&").forEach(function(part) {
            var item = part.split("=");
            result[item[0]] = decodeURIComponent(item[1]);
        });
        return result;
    }

    /* 
     Must not allow redirect from this code if the query does contain an empty 'q' parameter. It causes an error.
     This happens when opening a link from picture results, but sometimes also from normal web results. See examples below.

     Should not try to redirect from this code if the query contains google signature, as it will be redirected without stopping on the notice.

       Using this workaround you also circumvent the protection from malicious or hacked web pages,
     The redirect notice stops you from clicking on a google.com/url?q=... link and ending up on a different page. (e.g.bogus)
     You probably want to use this workaround for search plugins or your own browser extension.
     Check if redirected domain is one of allowed by you. As an example in disabled code shows.

     parameters google uses on redirection URIs and which might be important with redirection:
     iflsig - holds the signature from Google to authenticate its own redirects and avoid the notice.
           I think it authenticates only redirects between its own web pages.
     psig - probably the same/similar as iflsig. A redirect from google picture results has this.
     ved - referrer, does not make sense to use here.
     ust - a number, unknown meaning to me
     usg - [a-Z0-9_] unknown meaning to me
     url - a page to redirect to. Is 'url' a new version/substitute for 'q'?
     q - a page to redirect to. When url parameter is present, there is also an empty 'q'
     Is 'q' used if the redirect is external (from Google)? Or are they just old/new parameters?
        */

        var uriJson = getJsonFromUrl();
    if (!uriJson.iflsig && !uriJson.psig && uriJson.q !== ''

// use this to check the destination domain
//        && ( uriJson.q.indexOf('imdb.com') !== -1 ||
//             uriJson.q.indexOf('another-site.com') !== -1 )

       ) { window.location = uriJson.q; }


   // window.location = getJsonFromUrl().q;
  /* examples where a statement on a line above without a condition was causing an error
   these example links worked only 5 minutes or so, until the signature was changed

   * from images results
   https://www.google.com/url?sa=i&rct=j&q=&esrc=s&source=images&cd=&ved=2ahUKEwir6oWy3aHmAhWLZlAKHZTADEAQjhx6BAgBEAI&url=https%3A%2F%2Fwww.imdb.com%2FREMOVED&psig=AOvVaw2f6fIfMs28RSnPJ7Ow98KS&ust=1575745988682157

   * from web (normal) results
   https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=9&ved=2ahUKEwiRtOKE8qHmAhULL1AKHXUrACMQFjAIegQIAxAB&url=https%3A%2F%2Fsuperuser.com%2Fquestions%2F183554%2Fhow-to-recover-form-information-for-a-webpage-in-firefox&usg=AOvVaw3o_HBDRNqmzWbz1WQcqjPq
  */
})();
