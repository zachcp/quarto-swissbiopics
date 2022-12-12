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
  ['sbp'] = function(args, kwargs, meta) 

    quarto.doc.add_html_dependency({
      name = 'swissbiopics',
      scripts = {'resources/js/small-zone.js' },
      stylesheets = {'resources/css/biopicszone.css'}
    })

    -- todo check valid filename
    local filename = args[1][1]
    filename = pandoc.utils.stringify(filename)

    quarto.log.output("=== Handling SBP ===")
    quarto.log.output(filename)
    
    
    local svg_content = getfilecontent(filename)
    -- quarto.log.output(string.len(svg_content))

    local wrapped = f(
      "<div class=\"sbp\" data-name=\"${filename}.svg\"> <div id=\"cell\"> ${content} </div></div>", 
      {filename=filename, content=svg_content})

    return pandoc.RawBlock(
      'html', wrapped)

  end
}