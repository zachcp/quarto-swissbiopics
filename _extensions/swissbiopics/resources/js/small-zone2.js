

// remove the locations and restoer width
document.querySelector( ".sbp #locations").remove()

document.querySelector( ".sbp #cell").style.width = '100%';


subloc = "Endosome > Late endosome"
subloc = "Cytosol"

const subcellular = document.querySelectorAll("g .subcellular_location");

for (const organelle of subcellular) {
    console.log(organelle);
    let subcell_name = organelle.querySelector("text.subcell_name").textContent;
    if (subcell_name.includes(subloc)) {
        console.log("hurrah!");
        organelle.querySelector("path").setAttribute("class", "coloured selected");
    }
}





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