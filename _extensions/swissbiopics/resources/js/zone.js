// main js for public zone pages

// CAUTION script should not be async / defer (should be regular script in head), as init_tabs method should be called by in-lined script right after body start (to have tabs right from beginning...)
// (besides init_tabs) initializes itself after DOMContentLoaded

const Glob = {
    "prefix"   : "",
    "announce" : "" // CAUTION: do not commit msg here, just add announce txt when needed on public "running" servers!
};


document.addEventListener( "DOMContentLoaded",
    function() {
        document.removeEventListener( "DOMContentLoaded", arguments.callee, false);
        initz( document.body.id );
    },
    false
); // when dom loaded: initz


function initz() { // (when dom loaded) initialize all js systems

    //init_tabs(); should be launched right when <head> has loaded, otherwise pages with big protein lists will have tabs only visible after dom is fully loaded; should be inlined in template (webserver CSP should allow unsafe-inline)
    finalize_tabs();

    initFolding();
    initAutoComplete(); // init autocomplete
    injectAnnounce();

    initSliders();
    initDataTables();
    initCharts();
    initPDBs();

    initUniProtForms();

}


function injectAnnounce() {
    if ( Glob.announce ) {
        document.getElementById( "announce" ).appendChild(document.createTextNode(Glob.announce))
    }
}


/* ------ autocomplete (copied form core.js so that zone.js could be use standalone) ------ */


function initAutoComplete() {
    const elems = document.querySelectorAll( '[data-suggest-path]' );
    for( const elem of elems ) {
        prepareElemAutoComplete( elem );
    }

}


function prepareElemAutoComplete( elem, sid ) {
    const parent = elem.parentNode; // yes parent (likely form) needed: menu will be attached to parent, after target (likely input) elem
    elem.setAttribute( "data-public-sid", sid );
    elem.onmouseout = function( ev ) { ev.stopPropagation() };
    elem.autocomplete = "off"; // turn off browser input elem "auto complete"!
    elem.addEventListener(   "keyup",   startElemAutoComplete );
    elem.addEventListener(   "keydown", autoCompleteArrows );
    parent.addEventListener( "keyup",   function( ev ) {
        const k = ev.key.toLowerCase();
        if ( k === 'escape' || k === 'esc' ) { exitAutoComplete( this ) }
    } );
}


function startElemAutoComplete( ) { // onkeyup handler for an auto complete element
    const target = this;
    const parent = this.parentNode;
    const prefix = target.value;
    if ( prefix.length > 2 && prefix.length !== Number( target.getAttribute( "data-prev-size" ) ) ) { // if value has changed send txt for suggestion
        get( this.getAttribute( "data-suggest-path" )+"/"+target.value, this.getAttribute( 'data-public-sid' ) ).then( // request suggestions
            function( str ) { // upon suggestion arrival
                exitAutoComplete( parent ); // rm previous suggestion
                const ul     = document.createElement( 'ul' ); // add list
                ul.style     = "cursor:pointer";
                ul.className = "suggest";
                const lines  = cleanHTML( str ).split( /\r?\n/ );
                if ( str !== "" ) {
                    lines.forEach( // for each suggestion line add list line
                        function( line ) {
                            const txt       = line.replace( /<[^>]+>/gm, '' );
                            const li        = document.createElement( 'li' );
                            li.className  = "suggest";
                            li.innerHTML  = line;
                            li._value     = txt;
                            li.addEventListener( "mouseover", function( ) { focusMenuItem( this ) } );
                            li.addEventListener( "mouseout",  function( ) { unFocusMenuItem( this ) } );
                            li.addEventListener( "click", function( ) {
                                focusMenuItem( this );
                                target.value = txt; // yes works with both for input and textarea
                                this._focus = true;
                                target.focus();
                            } );
                            li.addEventListener( "dblclick", function( ) {
                                target.value = txt;
                                target.focus();
                                parent.submit();
                            } );
                            ul.appendChild( li ); // add list line to list
                            ul.addEventListener( "mouseleave", function( ) { exitAutoComplete( parent ) } );
                        }
                    );
                    parent.appendChild( ul ); // add list to parent of text/editable "field"
                }
            }
        );
    }
    else if ( target.value.length < 3 ) exitAutoComplete( parent );
    target.setAttribute( "data-prev-size", prefix.length );
}


function exitAutoComplete( parent_of_suggest_elem ) {
    const uls = parent_of_suggest_elem.getElementsByTagName( "ul" );
    if ( uls.length > 0 ) parent_of_suggest_elem.removeChild( uls[0] );
}


function unFocusParentMenu( li ) {
    const lis = li.parentNode.childNodes;
    for ( const li of lis ) { li._focus = false; li.className = "suggest" }
}
function focusMenuItem( li ) {
    unFocusParentMenu( li );
    li._focus    = true;
    li.className = "suggest_focus";
}
function unFocusMenuItem( li ) {
    unFocusParentMenu( li );
    li._focus    = false;
    li.className = "suggest";
}


function autoCompleteArrows( ev ) {
    const ul_menu = this.parentNode.lastChild;
    if ( ul_menu && ( ev.keyCode === 38 || ev.keyCode === 40 ) ) {
        const lis  = ul_menu.childNodes;
        const m    = lis.length;
        let ifocus = -1;
        for( let i=0 ; i<m; i++ ) {
            const li = lis[ i ];
            if ( li._focus === true ) { ifocus = i; break; }
        }
        const old_focus_li = lis[ ifocus ];
        let   new_focus_li = old_focus_li;
        if (      ev.keyCode === 38 && ifocus > 0 )       new_focus_li = lis[ ifocus - 1 ]; // up
        else if ( ev.keyCode === 38 && ifocus === 0 )     new_focus_li = lis[ m - 1 ];
        else if ( ev.keyCode === 40 && ifocus < m - 1 )   new_focus_li = lis[ ifocus + 1 ]; // down
        else if ( ev.keyCode === 40 && ifocus === m - 1 ) new_focus_li = lis[ 0 ];
        if ( new_focus_li !== old_focus_li ) { // move focus li
            if ( old_focus_li ) {
                old_focus_li.className = 'suggest';
                old_focus_li._focus    = false;
            }
            new_focus_li.className = 'suggest_focus';
            new_focus_li._focus    = true;
            this._value = new_focus_li._value;
        }
        ev.preventDefault();
    }
    else if ( this._value && ev.key.toLowerCase() === 'enter' ) {
        this.value = this._value;
        this.focus();
        if ( this.parentNode.tagName.toLowerCase() === 'form' ) this.parentNode.submit();
    }
}


/* ------ sequence selection & uniprot forms ------ */ // used by handlers defined in initz


function initUniProtForms() {
    // init uniprot list view form elements
    let elems = document.getElementsByClassName( "_form_sel_all" );
    for( const elem of elems ) {
        elem.addEventListener( 'click', function( ) {
            const form = this.parentNode;
            for( const q of form.q ) { // <input>s (type="checkbox") should have name="q"
                q.checked = true
            }
        } )
    }
    elems = document.getElementsByClassName( "_form_sel_none" );
    for( const elem of elems ) {
        elem.addEventListener( 'click', function( ) {
            const form = this.parentNode;
            for( const q of form.q ) {
                q.checked = false
            }
        } )
    }
    elems = document.getElementsByClassName( "_form_action_align" );
    for( const elem of elems ) {
        elem.addEventListener( 'click', function( ) {
            var form     = this.parentNode;
            form.method = 'get';
            form.action = 'https://www.uniprot.org/align';
            form._minsel = 2;
            addInputIds2UniProtQueryForm( form );
            // as elem is input.type = "submit", click will trigger form submission
        } )
    }
    elems = document.getElementsByClassName( "_form_action_retrieve" );
    for( const elem of elems ) {
        elem.addEventListener( 'click', function( ) {
            var form    = this.parentNode;
            form.method = 'get';
            form.action = 'https://www.uniprot.org/id-mapping';
            form._minsel = 1;
            addInputIds2UniProtQueryForm( form );
            // as elem is input.type = "submit", click will trigger form submission
        } )
    }
    elems = document.getElementsByClassName( "_form_action_map" );
    for( const elem of elems ) {
        elem.addEventListener( 'click', function( ) {
            var form    = this.parentNode;
            form.method = 'get';
            form.action = 'https://www.uniprot.org/id-mapping?from=UniProtKB_AC-ID&to=EMBL-GenBank-DDBJ';
            const to = document.createElement( 'input' );
            to.type  = "hidden";
            to.name  = 'to';
            to.value = 'EMBL-GenBank-DDBJ';
            form.appendChild( to );
            form._minsel = 1;
            addInputIds2UniProtQueryForm( form );
            // as elem is input.type = "submit", click will trigger form submission
        } )
    }

    const forms = document.getElementsByClassName( "_form" );
    for( const form of forms ) {
        form.addEventListener( 'submit', function( ev ) { // add submit check on form submit
            let nsel = 0;
            for( const q of this.q ) {
                if ( q.checked ) nsel++;
            }
            if ( this._minsel && nsel < this._minsel ) ev.preventDefault(); // prevent submission if n selected element is lower than expected _minsel
        } )
    }
}


function addInputIds2UniProtQueryForm( form ) { // query for retrieve, align, map against uniprot: wants query param (with ACs, ws separated), build query param from list (inputs with q name)
    let idListString = '';
    let elems        = [];
    if ( form.q.length ) { elems = form.q } // all form (protein) checkbox input elements should have name "q" (its value should = input protein AC)
    else                 { elems = [ form.q ] }
    for( const elem of elems ) {
        if ( elem.checked ) idListString = idListString + elem.value + ',';
    }
    const inputIDs = document.createElement( 'input' );
    inputIDs.type  = "hidden";
    inputIDs.name  = 'ids';
    inputIDs.value = idListString;
    // p.s. leftover 'q' inputs (will be submitted!) not a problem
    form.appendChild( inputIDs );
    form.target = "_blank";
}




/* ------ misc ------*/


// foldable panel
function initFolding() {
    const elems = document.getElementsByClassName( "foldbutton" ); // on button or img of class foldbutton
    for( const elem of elems ) { // for each targeted button/img
        if ( elem.getAttribute( "data-target-id" ) !== null ) {
            elem._target = document.getElementById( elem.getAttribute( "data-target-id" ) );
            elem._img    = elem.tagName === "IMG" ? elem : document.createElement( "img" ); // if not an img: create child img
            if ( elem.tagName !== "IMG" )    elem.appendChild( elem._img );
            if ( elem._target.className === 'hidden' ) elem._img.src = Glob.prefix+'/resources/images/expand.gif';
            else                                       elem._img.src = Glob.prefix+'/resources/images/collapse.gif';
            elem.addEventListener( 'click', function( ) { // add onClick
                if ( this._target.classList.contains('hidden') ) {
                    this._target.className = 'visible';
                    this._img.src = Glob.prefix+'/resources/images/collapse.gif'
                }
                else {
                    this._target.className = 'hidden';
                    this._img.src = Glob.prefix+'/resources/images/expand.gif'
                }
            } )
        }
    }
}



function s( id ) {
    document.getElementById( id ).className='tooltip';
} // !? not used in this js file (?used in html inlined handlers?)
function h( id ) {
    document.getElementById( id ).className='hidden';
} // !? not used in this js file (?used in html inlined handlers?)


/* ------ tabs (for uniprot view) ------*/


function finalize_tabs() {
    /* if js is on: after page has been loaded: build tabs based on (in page) t0-8 div... */

    const tb = document.getElementById( 'tab_bar' );
    const ul = document.createElement( 'ul' ); // create ul for list of tabs
    tb.appendChild( ul );

    let   n = 0;
    const id_base_list = [ 0, 6, 7, 8, 1, 2, 3, 4, 5 ]; // defines the order
    // 0 is core, 6, 7 uniprot views, 1-5 custom (from page content)
    for( let _i=0; _i<9; _i++ ) { // scan for tabbed content div#t0-8
        let i = id_base_list[ _i ];
        const div = document.getElementById( 't'  + i );
        if ( div ) { // div for tabbed content was found in page
            n++;
            const li     = document.createElement( 'li' ); // create li (tab)
            li.className = 'tab' + i;
            li._tid      = i;
            if (div.firstChild && div.firstChild.nodeName === 'A') li._href = div.firstChild.href;
            // add tab event listeners
            li.onclick = function() {
                set( this.className );
                if      ( this._tid === 0 ) window.location = cleanUrlOfAnchor();
                else if ( this._tid < 6 )   window.location = cleanUrlOfAnchor() + "#" + this.className;
                else if ( this._href )      window.location = this._href;
                else                        window.location = "#" + this.className;
            };
            li.onmouseover = function(){ this.id = 'tab_focus'; };
            li.onmouseout  = function(){ this.id = '' };

            var text = '?'; // build tab txt ...
            if ( div.title ) text = div.title;// use tabbed content div title if any
            else if ( i===0 && !div.title ) text = 'General';

            li.appendChild(document.createTextNode(text)); // add tab txt
            ul.appendChild(li); // add tab to tab bar
        }
    }
    if ( n>1 ) document.getElementById('tab_bar').className = 'final';  // show tab bar (if there is more than 1 tab)

}


function init_tabs() {
    /* (called at the beginning) (if js is on) will hide (via css) t>0
     tabbed div content... */
    document.body.id = 'tab0';
    // replace taball original id (then only tab0 will be shown during load)

    window.onbeforeunload = function () {  };
    // back button fix (when >=one tab is an external link: back did
    // not correctly reload previous content if on a different page!...)
    // just having an empty onbeforeunload event will cause the browser
    // to never cache the page... (without messing with Cache-Control,
    // Expires, Pragma ... http header)
    //
    // n.b. if tab + in place editing are used on the same page:
    //      this onbeforeunload will be overwritten (but it's ok)...

    // reading anchor url and jumping to corresponding tab
    var anchor = document.location.hash.substring(1);
    if ( anchor ) set( anchor );
}


function set(id) {/* set active tab (id = tab0-7) */
    document.body.id = id;// set tab
    // p.s. css trick: by default div#t<n (0-7)> are hidden (display:none)
    //      but div#t<n> under a n matching body#tab<n> (e.g. body#tab6 div#t6)
    //      are visible (display: block), so once the body id is set, the
    //      matching div#t<n> becomes visible.
}


function cleanUrlOfAnchor() {
    return ( window.location.toString().split("#")[0] );
}



// Helpers

function cleanHTML( str ) { // clean ("network content")!
    return str.replace( /<\/?script[^>]*>/gi, "" );
}



// HTTP queries ("ajax") with fetch API :


function get( path, sid ) {
    return fetch( path+( sid ? '?sid='+sid : '' ) ).catch(
        function( error ) {
            console.log( "Cannot GET "+path+" : "+error.message );
            return Promise.reject( error );
        }
    ).then(
        function( response ) {
            if ( response.ok ) {
                var reload = response.headers.get( 'X-Do-Reload' );
                if ( reload != null ) location.reload();
                return response.text()
            }
            else {
                var msg = response.headers.get( 'X-Message' );
                if ( msg === null ) msg = response.statusText;
                else                console.log( "Cannot GET; server X-Message: "+msg );
                return Promise.reject( new Error( msg ) )
            }
        }
    )
}


// MISC .... Datatable, Jssor (Slider) initialisation (cleaner than having inline script), PDB viewer/selector initialisation & handling
// p.s. Datatable, Jssor only works if jquery.js is loaded
// NOTE: duplicated in core.js, so each core.js & zone.js are stand-alone and independent
//       TO?DO?: keep separated (e.g. under xtra.js and have pages use core.js & xtra.js OR zone.js & xtra.js)
//               but then: CAUTION: public site run in cached mode, so as page will use new xtra.js, are src update on public sites + a release will have to be done...
//               OR have core.js & zone.js load xtra.js ?


// DataTable
function initDataTables() {
    var elems = document.querySelectorAll( '[data-is-jdata-table]' );
    for( const elem of elems ) {
        initDataTable0( elem );
    }
}

function initDataTable0( table ) {
    $(table).dataTable( { "iDisplayLength": 100 } );
}

// jssor slide shows
function initSliders() {
    var elems = document.querySelectorAll( '[data-is-slider]' );
    for( const elem of elems ) {
        initSlider0( elem.id );
    }
}

function initSlider0( cid ) {
    var _SlideshowTransitions = [
        //Fade
        { $Duration: 1200, $Opacity: 2 }
    ];

    var options = {
        $FillMode: 5,                             // 0: stretch, 1: contain (keep aspect ratio and put all inside slide), cover (keep aspect ratio and cover whole slide),4: actual size,5: contain for large image and actual size for small image

        $AutoPlay: false,                         //[Optional] Whether to auto play, to enable slideshow, this option must be set to true, default value is false
        $AutoPlaySteps: 1,                        //[Optional] Steps to go for each navigation request (this options applys only when slideshow disabled), the default value is 1
        $AutoPlayInterval: 3000,                  //[Optional] Interval (in milliseconds) to go for next slide since the previous stopped if the slider is auto playing, default value is 3000
        $PauseOnHover: 1,                         //[Optional] Whether to pause when mouse over if a slider is auto playing, 0 no pause, 1 pause for desktop, 2 pause for touch device, 3 pause for desktop and touch device, 4 freeze for desktop, 8 freeze for touch device, 12 freeze for desktop and touch device, default value is 1

        $ArrowKeyNavigation: true,                //[Optional] Allows keyboard (arrow key) navigation or not, default value is false
        $SlideDuration: 500,                      //[Optional] Specifies default duration (swipe) for slide in milliseconds, default value is 500
        $MinDragOffsetToSlide: 20,                //[Optional] Minimum drag offset to trigger slide , default value is 20
        //$SlideWidth: 600,                       //[Optional] Width of every slide in pixels, default value is width of 'slides' container
        //$SlideHeight: 300,                      //[Optional] Height of every slide in pixels, default value is height of 'slides' container
        $SlideSpacing: 0,                         //[Optional] Space between each slide in pixels, default value is 0
        $DisplayPieces: 1,                        //[Optional] Number of pieces to display (the slideshow would be disabled if the value is set to greater than 1), the default value is 1
        $ParkingPosition: 0,                      //[Optional] The offset position to park slide (this options applys only when slideshow disabled), default value is 0.
        $UISearchMode: 1,                         //[Optional] The way (0 parellel, 1 recursive, default value is 1) to search UI components (slides container, loading screen, navigator container, arrow navigator container, thumbnail navigator container etc).
        $PlayOrientation: 1,                      //[Optional] Orientation to play slide (for auto play, navigation), 1 horizental, 2 vertical, 5 horizental reverse, 6 vertical reverse, default value is 1
        $DragOrientation: 3,                      //[Optional] Orientation to drag slide, 0 no drag, 1 horizental, 2 vertical, 3 either, default value is 1 (Note that the $DragOrientation should be the same as $PlayOrientation when $DisplayPieces is greater than 1, or parking position is not 0)

        $SlideshowOptions: {                      //[Optional] Options to specify and enable slideshow or not
            $Class: $JssorSlideshowRunner$,       //[Required] Class to create instance of slideshow
            $Transitions: _SlideshowTransitions,  //[Required] An array of slideshow transitions to play slideshow
            $TransitionsOrder: 1,                 //[Optional] The way to choose transition to play slide, 1 Sequence, 0 Random
            $ShowLink: true                       //[Optional] Whether to bring slide link on top of the slider when slideshow is running, default value is false
        },

        $BulletNavigatorOptions: {                //[Optional] Options to specify and enable navigator or not
            $Class: $JssorBulletNavigator$,       //[Required] Class to create navigator instance
            $ChanceToShow: 2,                     //[Required] 0 Never, 1 Mouse Over, 2 Always
            $AutoCenter: 3,                       //[Optional] Auto center navigator in parent container, 0 None, 1 Horizontal, 2 Vertical, 3 Both, default value is 0
            $Steps: 1,                            //[Optional] Steps to go for each navigation request, default value is 1
            $Lanes: 1,                            //[Optional] Specify lanes to arrange items, default value is 1
            $SpacingX: 10,                        //[Optional] Horizontal space between each item in pixel, default value is 0
            $SpacingY: 10,                        //[Optional] Vertical space between each item in pixel, default value is 0
            $Orientation: 1                       //[Optional] The orientation of the navigator, 1 horizontal, 2 vertical, default value is 1
        },

        $ArrowNavigatorOptions: {
            $Class: $JssorArrowNavigator$,        //[Requried] Class to create arrow navigator instance
            $ChanceToShow: 1,                     //[Required] 0 Never, 1 Mouse Over, 2 Always
            $Steps: 1                             //[Optional] Steps to go for each navigation request, default value is 1
        }
    };
    new $JssorSlider$( cid, options );
}


// (Google) Charts
// n.b. google charts loader.js must be loaded

function initCharts() {
    if ( document.querySelector( ".chart" ) ) {
        google.charts.load( 'current', {'packages':[ 'corechart' ] } );
        google.charts.setOnLoadCallback( buildCharts );
    }
}

function buildCharts() {
    for ( const elem of document.querySelectorAll( ".chart" ) ) buildChart( elem );
}

//function buildChart( target ) {
//   buildColumnChart( target );
//}

function verticalTableDataExtract( table, xIsString, xIsDate ) { // extract data from table with rows = [ X1, Ya1, Yb1 ...]... into an array
    var hAxisIsFloat = false;
    // build data struct for chart
    var darray  = [];
    var nlabels = 0;
    for ( tr of table.querySelectorAll("tr" ) ) { // add data lines
        const isLabelLine = darray.length === 0;
        var tds = [];
        for ( td of tr.querySelectorAll("td, th" ) ) {
            if ( isLabelLine ) { nlabels++; tds.push( td.textContent ); }
            else {
                const isX    = !tds.length && !isLabelLine;
                const nvalue = td.textContent.replace( /,/g, '' );
                if ( isX && !xIsString && !xIsDate && !isNaN(nvalue) && nvalue.includes('.') ) hAxisIsFloat = true;
                if ( isX && ( isNaN(nvalue) || xIsString ) ) tds.push( td.textContent ); // if not a number or should-be-string (e.g. for pie chart): parse 1st column (X axis) as string
                else tds.push( parseFloat( nvalue ) ); // any other cases: parse as float
            }
        }
        if ( tds.length < nlabels ) { // add missing column! in case table is malformed!
            const n_missing = nlabels - tds.length;
            for (let i = 0; i < n_missing; i++) tds.push(NaN);
        }
        darray.push(tds);
    }
    return( { darray: darray, hAxisIsFloat: hAxisIsFloat } );
}

function horizontalTableDataExtract( table, xIsString, xIsDate ) { // extract data from table with columns = [ X1, Ya1, Yb1 ...]... into an array
    var hAxisIsFloat = false;
    // build data struct for chart
    var darray  = [];
    var nlabels = 0;
    const trs  = table.querySelectorAll( "tr" );
    const ncol = trs[0].querySelectorAll("td, th" ).length;
    for ( let i = 0; i < ncol; i++ ) {
        const isLabel = i === 0;
        var column = [];
        for ( tr of trs ) {
            const isX = !isLabel && column.length === 0;
            const td  = tr.querySelectorAll("td, th")[i];
            if ( td ) {
                if ( isLabel ) column.push( td.textContent );
                else {
                    const nvalue = td.textContent.replace( /,/g, '' );
                    if ( isX && !xIsString && !xIsDate && !isNaN(nvalue) && nvalue.includes('.') ) hAxisIsFloat = true;
                    if ( isX && xIsDate ) {
                        const dstr = td.textContent.replace( /\./g,'-').replace( /(\d{2})-(\d{4})/, '$2-$1' ).replace( /(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1' );
                        column.push( new Date( dstr ) );
                    }
                    else if ( isX && ( isNaN(nvalue) || xIsString ) ) column.push( td.textContent );
                    else column.push( parseFloat( nvalue ) );
                }
            }
            else column.push( NaN );
        }
        darray.push(column);
    }
    return( { darray: darray, hAxisIsFloat: hAxisIsFloat } );
}

function buildChart( target ) { // build chart, so far based on inner table content, type: column/bar (default), pie, line/curve/timeSeries
    const table     = target.querySelector( "table" );
    const xIsString = target.getAttribute( "data-type" ) === "pie";
    const xIsDate   = target.getAttribute( "data-type" ) === "timeSeries";
    const colIsXY   = target.getAttribute( "data-orientation" ) === "horizontal";
    const { darray, hAxisIsFloat } = table ? (
        colIsXY ?
            horizontalTableDataExtract( table, xIsString, xIsDate ) :
            verticalTableDataExtract(   table, xIsString, xIsDate ) // classical & matching gchart data orientation (lines are XY...)
    ) : { darray: [], hAxisIsFloat: false };
    const labels = darray[0];
    const data   = google.visualization.arrayToDataTable( darray );
    // build chart container (div)
    const container = document.createElement( "div" );
    if ( table ) target.removeChild( table );
    target.appendChild( container );
    // draw chart
    const options = {
        title:  target.getAttribute( "data-title" )  ? target.getAttribute( "data-title" ) : "...",
        width:  target.getAttribute( "data-width" )  ? parseInt( target.getAttribute( "data-width" ) )  : 600,
        height: target.getAttribute( "data-height" ) ? parseInt( target.getAttribute( "data-height" ) ) : 450,
        bar:  { groupWidth: '40%' },
        hAxis: {},
        vAxis: {}
    };
    const isXY = labels.length === 2;
    options.hAxis.format = hAxisIsFloat || xIsDate ? null : "#";  // if horiz axis is not float (and not time); display its values as plain number [if a number] without ,. formatting (in case it's a year)
    options.hAxis.title  = labels[0];
    options.vAxis.title  = isXY ? labels[1] : ''; // vertical axis title = label for col2 if data has 2 columns (XY) (otherwise: no vtitle; legend should be used)
    options.legend       = isXY && target.getAttribute( "data-type" ) !== "pie" ? 'none' : null; // no legend for 2 columns data (XY) unless type is pie
    var chart;
    switch ( target.getAttribute( "data-type" ) ) {
        case "pie" :
            chart = new google.visualization.PieChart( container );
            break;
        case "curve" :
            options.curveType = "function";
        case "line" :
        case "timeSeries" :
            if ( darray.length < 21 ) options.pointSize = "5";
            chart = new google.visualization.LineChart( container );
            break;
        default: // for bar = column charts
            chart = new google.visualization.ColumnChart( container );
    }
    chart.draw( data, options );
}


// PDB (pdbe-molstar)

function initPDBs() {
    // scan for any elem with attribute data-pdb ...
    var elems = document.querySelectorAll( '[data-pdb]' );
    for( const elem of elems ) {
        initPDB( elem );
    }
    initPDBSelects();
}

function initPDB( container ) {
    // for div with attribute data-pdb: create PDBeMolstar viewer showing specified pdb
    // format: data-pdb=<pdbid>
    if ( typeof PDBeMolstarPlugin !== 'undefined' ) {
        var viewer = new PDBeMolstarPlugin();
        var options = {
            visualStyle: 'cartoon',
            lighting: 'glossy',
            expanded: false,
            hideControls: true
        };
        options.moleculeId = container.getAttribute( "data-pdb" ).toLowerCase();
        viewer.render( container, options );
        container._viewer = viewer;
    }
}
// see https://github.com/PDBeurope/pdbe-molstar/wiki/1.-PDBe-Molstar-as-JS-plugin
//     https://github.com/PDBeurope/pdbe-molstar/wiki/3.-Helper-Methods


function initPDBSelects() {
    // scan for any elem with attribute data-target-pdb ...
    var elems = document.querySelectorAll( '[data-target-pdb]' );
    for( const elem of elems ) {
        initPDBSelect( elem, elems );
    }
}

function initPDBSelect( elem, elems ) {
    // for elem with attribute data-target-pdb
    // add event handler to select specified position range in pdb
    // format: data-target-pdb="<pdbid>|<chain>:<start>[-<stop>][,...]" )
    const params = elem.getAttribute( "data-target-pdb" ).split( '\|' );
    const target = params[0].split(':')[0];
    const pdb_container = document.querySelector( '[data-pdb="'+target+'"]' );
    if ( pdb_container ) {
        const selects = params[1].split(',');
        var   vranges = []; // /n.b. ... closure: vranges is in context for elem event handler = will be accessible in event handler
        for ( const select of selects ) { // create data structure for viewer selection "ranges"
            const selems = select.split( ':' );
            const chain  = selems[0];
            const range  = selems[1].split('-');
            const start  = parseInt( range[0] );
            const stop   = range[1] ? parseInt( range[1] ) : start;
            if ( start === stop ) vranges.push( { entity_id: '1', struct_asym_id: chain, residue_number: start,                                 color:{r:255,g:20,b:20}, representationColor:{r:255,g:20,b:20}, representation: 'molecular-surface', focus: false } );
            else                  vranges.push( { entity_id: '1', struct_asym_id: chain, start_residue_number: start, end_residue_number: stop, color:{r:255,g:20,b:20}, representationColor:{r:255,g:20,b:20}, representation: 'molecular-surface', focus: false } );
        }
        elem.addEventListener( 'click', // add onclick on selector (that will select requested range(s) on target pdb
            function( ev ) {
                ev.preventDefault();
                const focus = !!ev.shiftKey;
                if ( elem.classList.contains( 'pdbselect' ) ) {
                    for ( const e of elems ) e.classList.remove( 'pdbselect' );
                    pdb_container._viewer.visual.clearSelection();
                }
                else {
                    for ( const e of elems ) e.classList.remove( 'pdbselect' );
                    elem.classList.add( 'pdbselect' );
                    for ( vrange of vranges ) vrange.focus = focus;
                    //pdb_container._viewer.visual.clearSelection();
                    pdb_container._viewer.visual.select( { data: vranges, nonSelectedColor: {r:80,g:80,b:120} } );
                }
            }
        )
    }
}
