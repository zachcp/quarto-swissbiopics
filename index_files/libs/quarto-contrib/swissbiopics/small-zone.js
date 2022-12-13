// const target  = div.getAttribute( "data-target" );
const targetSVGElems = "path, circle, ellipse, polygon, rect, polyline, line";
const hiddenSLs      = [ 'SL0198', 'SL0457', 'SL0458' ]; // list of sls hidden when not selected / mouse-over-ed


// L73
const holder = document.querySelector( ".sbp" ); // holder/target: div.sbp
const iname  = "Animal_cells.svg"
var svg;

function getCellName( svg, iname ) {
    const svgname_h = svg.querySelector( ":scope > text[property=name]" );// fetch img name from svg
    return svgname_h ? svgname_h.textContent : ( iname ? iname.replace( /\.svg$/, "" ).replace( /_/g, " " ) : "" );
}


function initPage(id) {
    // console.log(id);
    // console.log(`#${id} .sbp`);

    // const target  = div.getAttribute( "data-target" );
    const targetSVGElems = "path, circle, ellipse, polygon, rect, polyline, line";
    const hiddenSLs      = [ 'SL0198', 'SL0457', 'SL0458' ]; // list of sls hidden when not selected / mouse-over-ed

    const holder         = document.querySelector( `#${id} ` ); // holder/target: div.sbp
    //console.log(holder);

    // luse in global context
    svg = holder.querySelector( "#cell svg" );
    // const svgname = getCellName( svg, iname );
    const title0  = document.querySelector( "h1.ctitle" );
    const title   = title0 ? title0 : document.createElement( "h1" ); // if not already there create h1 title
    
    // if ( svgname ) {
    //     title.innerText = svgname;
    //     title.classList.add( "ctitle" );
    //     if ( !title0 ) document.querySelector( "#wiki" ).prepend( title );
    // }

    // build location list
    const list   = document.createElement( "ul" );
    const garray = [].slice.call( svg.querySelectorAll( "g.subcellular_location" ) ); // all data is in svg g(roup) elements
    for ( const locgrp of garray ) { // add parent name if any (1 level1) (for sorting)
        const grp_loc_name_elem = locgrp.querySelector( ":scope > .subcell_name" );
        const par_grp = locgrp.parentNode.classList.contains( "subcellular_location" ) ? locgrp.parentNode : ( locgrp.parentNode.parentNode.classList.contains( "subcellular_location" ) ? locgrp.parentNode.parentNode : null ); // yes now there are (sometimes) 1 extra non subcellular_location parent group
        const par_loc_name_elem = par_grp !== null ? par_grp.querySelector( ":scope > .subcell_name" ) : null;
        if ( par_loc_name_elem !== null ) { // is a child element
            grp_loc_name_elem.textContent = par_loc_name_elem.textContent + " > " + grp_loc_name_elem.textContent;
        }
    }

    const grps   = garray.sort( ( a,b ) => a.querySelector( ".subcell_name" ) == null || b.querySelector( ".subcell_name" ) == null ? 0 : ( a.querySelector( ".subcell_name" ).textContent.toLowerCase() > b.querySelector( ".subcell_name" ).textContent.toLowerCase() ? 1 : -1 ) ); // sort groups by subcell names

    console.log(garray);

    for ( const locgrp of grps ) { // foreach location in svg: extract data, build list, attach event handlers
        const sl         = locgrp.id; // SLId e.g. SL0188
        const name_te    = locgrp.querySelector( ":scope > .subcell_name" );
        const desc_te    = locgrp.querySelector( ":scope > .subcell_description");
        if ( name_te !== null && desc_te !== null && name_te.textContent !== "Extracellular space" ) { // n.b. ignore "Extracellular space" location (but not if child e.g. of secreted!? TODO FIXTHIS)
            const loc_name_0 = name_te.textContent;
            const indents    = loc_name_0.replace(/[^>]/g,'').length;
            const loc_name   = loc_name_0.replace( /^.+> /, '' );

            // build location li
            const li = document.createElement("li");
            li.setAttribute( "x-slid", sl );
            li.id = sl+"_info";
            if ( indents > 0 ) li.style.marginLeft = indents+"rem";
            // build link to uniprot
            const a = document.createElement("a");
            a.href = "https://www.uniprot.org/locations/"+sl.replace( /^SL(?!-)/, "SL-" ); a.className = "subcell_name";
            a.appendChild( document.createTextNode( loc_name ) );
            li.appendChild( a );
            // build associated location popup
            const desc_div = buildDescDiv( desc_te.textContent, loc_name, li, svg );
            li.appendChild( desc_div );
            list.appendChild( li ); // add list item to list

            if ( hiddenSLs.includes( locgrp.id ) ) locgrp.setAttribute( "visibility", "hidden" );

            // add event handlers
            // On SVG elements
            const grpsvgs = locgrp.querySelectorAll( targetSVGElems );
            for ( const el of grpsvgs ) { // add handlers over svg drawing elements within group (not directly over group itself)
                el.addEventListener( "mouseenter", function(ev) {
                    deLookAtAll( grps, list ); // remove all lookeday! mouseleave stuff not enough ... in case multiple overlapping svg elems are "called"...
                    for ( const s of grpsvgs ) s.classList.add( "lookedAt" ); // highlight all grp svg elems
                    li.classList.add( "lookedAt" ); // highlight location list elem:
                    li.scrollIntoView();
                } );
                el.addEventListener( "mouseleave", function() {
                    for ( const s of grpsvgs ) s.classList.remove( "lookedAt" ); // dehighlight all grp svg elems //el.classList.remove( "lookedAt" );
                    li.classList.remove( "lookedAt" );
                    locgrp.classList.remove( "lookedAt" );
                }  );
                el.addEventListener( "click", function( ev ) {
                    if ( ev._delayed ) clearTimeout( ev._delayed ); // cancel hiding of popup requested by parent grp (e.g. nucleus over nucleolus)
                    const delayed = setTimeout(
                        function() { // turn off all other popup
                            for ( const pop of document.querySelectorAll( ".popup_div" ) ) if ( pop.id != desc_div.id ) pop.classList.add( "hidden" );
                        }, 50 );
                    ev._delayed = delayed;
                    desc_div.classList.toggle( "hidden" ); // toggle popup
                    deLookAtAll( grps, list );
                    deSelectAll( grps, list );
                    if ( !desc_div.classList.contains( "hidden" ) ) { // sticky popup visible = SELECTED
                        positionBy( desc_div, el );
                        for ( const s of grpsvgs ) s.classList.add( "selected" ); // select svg elems
                        li.classList.add( "selected" ); // select li
                        svg._active_popup = desc_div;
                    }
                    ev.stopPropagation();
                } );
            }

            // On location LIST (n.b. as popup desc_div are child of li, will also receive those events!)
            const gsel = "g#"+li.getAttribute("x-slid")+".subcellular_location";
            li.addEventListener( "mouseenter", function() {
                deLookAtAll( grps, list );
                li.classList.add( "lookedAt" );
                const g = document.querySelector( gsel ); // find associated svg group
                g.setAttribute( "visibility", "visible" );
                for ( const el of g.querySelectorAll( targetSVGElems ) ) { // for all svg elems inside associated svg group
                    el.classList.add( "lookedAt" );
                }
            } );
            li.addEventListener( "mouseleave", function() {
                li.classList.remove( "lookedAt" );
                const g = document.querySelector( gsel ); // find associated svg group
                if ( hiddenSLs.includes( g.id ) && !li.classList.contains( "selected" ) ) g.setAttribute( "visibility", "hidden" );
                for ( const el of g.querySelectorAll( targetSVGElems ) ) { // for all svg elems inside associated svg group
                    el.classList.remove( "lookedAt" );
                }
            } );
            li.addEventListener( "click", function( ev ) {
                for ( const pop of document.querySelectorAll( ".popup_div" ) ) if ( pop.id !== desc_div.id ) pop.classList.add( "hidden" ); // hide other popups
                const g = document.querySelector( gsel );
                desc_div.classList.toggle( "hidden" ); // toggle show/hide popup
                deSelectAll( grps, list );
                if ( !desc_div.classList.contains( "hidden" ) ) { // sticky = SELECTED
                    g.setAttribute( "visibility", "visible" );
                    let lowest;
                    for ( sv of g.querySelectorAll( targetSVGElems ) ) {
                        const r  = sv.getBoundingClientRect();
                        const lr = lowest ? lowest.getBoundingClientRect() : null;
                        if ( !lr || r.bottom > lr.bottom || ( r.bottom === lr.bottom && r.left < lr.left ) ) lowest = sv;
                        sv.classList.add( "selected" );
                    }
                    li.classList.add( "selected" );
                    resetViewBox( svg );
                    positionBy( desc_div, ( lowest  ? lowest : g ) );
                    svg._active_popup = desc_div;
                }
                ev.stopPropagation();
                ev.preventDefault();
            } );
        }
    }


    const panel = document.createElement("div");
    panel.id    = "locations";
    panel.appendChild( list );
    holder.appendChild( panel );

    holder.addEventListener( 'click', function(ev) { // default click holder behaviour when not over svg elem: reset all
        deLookAtAll( grps, list );
        deSelectAll( grps, list );
        for ( const pop of document.querySelectorAll( ".popup_div" ) ) pop.classList.add( "hidden" );
    } );


    svg.addEventListener( 'mousemove', function(ev) { // record mouse pos for zoom (and more...)
        svg._mouse_x = ev.clientX;
        svg._mouse_y = ev.clientY;
        if ( svg._active_popup && svg._popup_drag ) { // if here = popup mouse was lost during move (too fast, outside of popup!), move it here!...
            const pop = svg._active_popup;
            pop.style.cursor = "move";
            if ( ev.which === 1 ) {
                event.preventDefault();
                pop.style.left = (ev.clientX + pop._offset_x) + 'px';
                pop.style.top  = (ev.clientY + pop._offset_y) + 'px';
            }
        }
    } );
    
    svg.addEventListener( 'wheel', function(ev) { // handle ZOOM
        const scale = ev.deltaY < 0 ? 1.08 : 0.92;
        const viewbox = scaleViewBox( svg, scale, svg._mouse_x, svg._mouse_y );
        if ( true ) { // if ( ev.shiftKey ) {
            svg.setAttribute( "viewBox", viewbox );
            if ( svg._active_popup ) {
                svg._active_popup.classList.add( "hidden" );
                deSelectAll( grps, list );
            }
        }
        ev.preventDefault();
        ev.stopPropagation();
    });

    document.addEventListener( "keydown", function( ev ) {
        if ( ev.keyCode === 27 ) reset( grps, list, svg );
    } );

    window.addEventListener( "resize", function( ev ) { reset( grps, list, svg ); } );

    selectByAnchor( holder, targetSVGElems );

}


// location POPUP

function buildDescDiv( desc, name, li, svg ) {
    const desc_div = document.createElement("div"); desc_div.className = "popup_div hidden"; desc_div.id=li.id+"_desc";
    const name_div = document.createElement('div'); name_div.className = "popup_name";
    name_div.appendChild( document.createTextNode( name ) );
    // addUniProtLink( name_div, li );
    // addGoLinks( name_div, li );
    desc_div.appendChild( name_div );
    const content = document.createElement('div');
    content.appendChild( document.createTextNode( desc ) );
    desc_div.appendChild( content );
    // add event listeners to move popup (caution as inside list, li elem will also receive those events!)
    desc_div.addEventListener( 'mousedown', function(ev) {
        if (ev.which === 1 ) {
            const pi              = desc_div.getBoundingClientRect();
            desc_div.style.cursor = "move";
            desc_div._ori_left    = desc_div.style.left;
            desc_div._ori_top     = desc_div.style.top;
            desc_div._offset_x    = pi.left - ev.clientX;
            desc_div._offset_y    = pi.top  - ev.clientY;
            svg._popup_drag       = true;
        }
    } );
    desc_div.addEventListener( 'mouseup', function(ev) {
        desc_div.style.cursor = "pointer";
        svg._popup_drag = false;
    } );
    desc_div.addEventListener( 'mousemove', function(ev) {
        event.preventDefault();
        desc_div.style.cursor = "move";
        desc_div._moving      = true;
        if ( svg._popup_drag ) { // n.b. if ( ev.which === 1 ) bad on firefox stay at 1 event when mouse released
            desc_div.style.left = (ev.clientX + desc_div._offset_x) + 'px';
            desc_div.style.top  = (ev.clientY + desc_div._offset_y) + 'px';
        }
        ev.stopPropagation();
    } ); // caution: if cursor moved too fast and mouse is outside popup: popup will not receive mouse events!
    desc_div.addEventListener( 'click', function(ev) {
        if ( desc_div._ori_left !== desc_div.style.left || desc_div._ori_top !== desc_div.style.top ) ev.stopPropagation(); // if moved, prevent click propagation to li handler that will toggle = close popup
    }, false);
    return( desc_div );
}

// Deselects

function deSelectAll( grps, list ) {
    for ( const gg of grps ) { // deselect all SVG elements
        if ( hiddenSLs.includes( gg.id ) ) gg.setAttribute( "visibility", "hidden" );
        for ( se of gg.querySelectorAll( targetSVGElems ) ) se.classList.remove( "selected" ); // de select every svg elem
    }
    for ( const li of list.querySelectorAll( "li" ) ) li.classList.remove( "selected" ); // de select every li
}
function deLookAtAll( grps, list ) {
    for ( const gg of grps ) { // deselect all SVG elements
        for ( se of gg.querySelectorAll( targetSVGElems ) ) se.classList.remove( "lookedAt" ); // de select every svg elem
    }
    for ( const li of list.querySelectorAll( "li" ) ) li.classList.remove( "lookedAt" ); // de select every li
}
function reset( grps, list, svg ) {
    deLookAtAll( grps, list );
    deSelectAll( grps, list );
    resetViewBox( svg );
    for ( const pop of document.querySelectorAll( ".popup_div" ) ) pop.classList.add( "hidden" );
}

function resetViewBox( svg ) { svg.setAttribute( "viewBox", svg._ori_viewbox ); }


// MISC

function selectByAnchor( holder, targetSVGElems ) {
    const ufrags = document.URL.split('#');
    if ( ufrags.length > 1 && ufrags[1].length > 2 ) {
        const targetId = ufrags[1];
        if ( targetId.toUpperCase().startsWith("SL") ) selectLocation( holder, targetId.toUpperCase().replace( "-", "" ) ); // by SLid
        else if ( targetId.match( /^\d+$/ ) ) selectLocation( holder, "SL"+(targetId.length < 4 ? "0".repeat( 4 - targetId.length ) : "")+targetId );
        else { // by name ?
            const name  = targetId.replace( /%22/g, "" ).replace( /%20/g, " " );
            const _name = name.toLowerCase()
            let foundGrp;
            for ( const g of holder.querySelectorAll( "g.subcellular_location" ) ) if ( g.querySelector( ".subcell_name" ).textContent.toLowerCase().replace( /^[^>]+ > /, '' ).includes( _name ) ) foundGrp = g;
            if ( foundGrp ) selectLocation( holder, foundGrp.id );
        }
    }
}
function selectLocation( holder, slid ) {
    const g = holder.querySelector( "svg g#"+slid+".subcellular_location" );
    if ( g ) {
        const pop = holder.querySelector( "#locations div#"+slid+"_info_desc" );
        let lowest;
        for ( sv of g.querySelectorAll( targetSVGElems ) ) {
            const r  = sv.getBoundingClientRect();
            const lr = lowest ? lowest.getBoundingClientRect() : null;
            if ( !lr || r.bottom > lr.bottom || ( r.bottom === lr.bottom && r.left < lr.left ) ) lowest = sv;
            sv.setAttribute( "visibility", "visible" ); // set svg elem to visible (few location are invisible by default, appear only with mouseover)
            sv.classList.add( "selected" ); // select svg elements
        }
        const li = holder.querySelector( "#locations li#"+slid+"_info" )
        li.classList.add( "selected" ); // select li
        li.scrollIntoView();
        // position & show popup:
        holder.querySelector( "svg" )._active_popup = pop;
        pop.classList.remove( "hidden" );
        positionBy( pop, ( lowest  ? lowest : g ) );
    }
}


function positionBy( target, by, do_center ) {
    const by_drect      = by.getBoundingClientRect(); // caution: by elem should be visible! // n.b. getBoundingClientRect coordinates refer to visible viewport = it does not consider x,y offsets; whereas css (absolute) positioning consider those.
    const target_width  = target.clientWidth; // caution: target elem should be visible!
    const win_width     = document.documentElement.clientWidth * 0.97 - 10;
    const win_height    = document.documentElement.clientHeight;
    const cell_drect    = document.querySelector( "#cell" ).getBoundingClientRect(); // TODO pass cell as function param!
    const cell_right    = cell_drect.right + 10;
    const cell_bottom   = cell_drect.bottom + 10;
    target.style.left   = by_drect.x      + window.pageXOffset +"px"; // set target left based on by
    target.style.top    = by_drect.bottom + window.pageYOffset +"px"; // set target bottom based on by
    if ( do_center ) target.style.left = ( cell_drect.width - target_width ) / 2.0 + "px";
    if ( by_drect.x + target_width > cell_right ) target.style.left = ( window.pageXOffset + cell_right - target_width )+"px"; // too right
    if ( target.style.left.slice(0,-2) < 4 ) target.style.left = "4px"; // too left
    if ( win_width < 416 ) { target.style.top = win_height / 1.25 + window.pageYOffset +"px"; target.style.left = win_width / 6.8 + window.pageXOffset + "px"; } // for mobile portrait orientation
    if ( by_drect.bottom > cell_bottom ) target.style.top = ( window.pageYOffset + cell_bottom )+"px"; // too low
}