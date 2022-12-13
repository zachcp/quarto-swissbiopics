-- Helper Functions for files/strings -----------------------------------

---Format string like in bash or python,
---e.g. f('Hello ${one}', {one = 'world'})
---@param s string The string to format
---@param kwargs {[string]: string} A table with key-value replacemen pairs
---@return string
local function f(s, kwargs)
  return (s:gsub('($%b{})', function(w) return kwargs[w:sub(3, -2)] or w end))
end


function readAll(file)
  local f = assert(io.open(file, "r"))
  local content = f:read("*all")
  f:close()
  return content
end


local random = math.random
local function uuid()
    local template ='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    return string.gsub('div_'.. template, '[xy]', function (c)
        local v = (c == 'x') and random(0, 0xf) or random(8, 0xb)
        return string.format('%x', v)
    end)
end



--- find local SVG and return as a string
function getfilecontent(filename)

  local fullpath = debug.getinfo(1,"S").source:sub(2)
  fullpath = io.popen("realpath '"..fullpath.."'", 'r'):read('a')
  fullpath = fullpath:gsub('[\n\r]*$','')

  local localdir, fname = fullpath:match('^(.*/)([^/]-)$')
  local local_svg = f(
    "${localdir}resources/images/${fname}.svg", 
    {localdir=localdir, fname=filename})

  -- quarto.log.output(local_svg)
  local svg_string = readAll(pandoc.utils.stringify(local_svg))
  return svg_string
end


-- Core Function -----------------------------------


return {

  ['sbp-full'] = function(args) 

    quarto.log.output("i'm in  full!")
    quarto.doc.add_html_dependency({
      name = 'swissbiopics',
      scripts = {'resources/js/small-zone.js' },
      stylesheets = {'resources/css/biopicszone.css'}
    })


    -- todo check valid filename
    local filename = args[1][1]
    filename = pandoc.utils.stringify(filename)

    -- load svg as text
    local svg_content = getfilecontent(filename)

    -- two div layers required for the SBP JS to work
    local wrapped = f(
      [[
        <div class="sbp" data-name="${filename}.svg"> 
          <div id="cell"> ${content} </div>
        </div>
  
        <script>
          document.addEventListener( "DOMContentLoaded",
              function() {
                  document.removeEventListener( "DOMContentLoaded", arguments.callee, false);
                  // initCardsView();
                  initPage();
              },
              false
          );
        </script>
      ]],
      {filename=filename, content=svg_content})


    return pandoc.RawBlock(
      'html', wrapped)
  end,
  
  ['sbp'] = function(args, kwargs) 

        quarto.log.output("i'm in  sbp!")
        quarto.log.output(kwargs)

        quarto.doc.add_html_dependency({
          name = 'swissbiopics',
          stylesheets = {'resources/css/biopicszone.css'}
        })
    
    
        -- todo check valid filename
        local filename = args[1][1]
        filename = pandoc.utils.stringify(filename)
    
        -- load svg as text
        local svg_content = getfilecontent(filename)
    
        local highlight = pandoc.utils.stringify(kwargs['highlight'][1])
        quarto.log.output(kwargs)
        quarto.log.output(highlight)


        local div_uuid = uuid()
        -- two div layers required for the SBP JS to work
        local wrapped = f([[
          <div class="sbp" id="${uid}" data="${filename}.svg"> 
            <div id="cell"> ${content} </div>
          </div>
          <script>

            document.addEventListener( "DOMContentLoaded",
              function() {
                  console.log("in da ting");
                  document.removeEventListener( "DOMContentLoaded", arguments.callee, false);
                  document.querySelector( "#${uid} #cell").style.width = '100%';
      
                  subloc = "${highlight}";
                  subcellular = document.querySelectorAll("#${uid} #cell svg g .subcellular_location");
      
                  for (const organelle of subcellular) {
                      console.log(organelle);
                      let subcell_name = organelle.querySelector("text.subcell_name").textContent;
                      console.log(subcell_name);
                      if (subcell_name.toLowerCase().includes(subloc.toLowerCase())) {
                          console.log("hurrah!");
                          organelle.querySelector("path").setAttribute("class", "coloured selected");
                      }
                  }
              },
              false
            );

          </script>
        ]],
        {filename=filename, uid=div_uuid, content=svg_content, highlight=highlight})
        
    
        return pandoc.RawBlock(
          'html', wrapped)    

  end
}