
function readAll(file)
  local f = assert(io.open(file, "r"))
  local content = f:read("*all")
  f:close()
  return content
end


function getlocaldir()
  local fullpath = debug.getinfo(1,"S").source:sub(2)
  fullpath = io.popen("realpath '"..fullpath.."'", 'r'):read('a')
  fullpath = fullpath:gsub('[\n\r]*$','')
  local dirname, filename = fullpath:match('^(.*/)([^/]-)$')
  return dirname
end



---Format string like in bash or python,
---e.g. f('Hello ${one}', {one = 'world'})
---@param s string The string to format
---@param kwargs {[string]: string} A table with key-value replacemen pairs
---@return string
local function f(s, kwargs)
  return (s:gsub('($%b{})', function(w) return kwargs[w:sub(3, -2)] or w end))
end



---@param viewerFunctionString string
---@return string
local function wrapInlineDivorig(viewerFunctionString)
  return "<div> ${contenct} </div>"
end


return {
  ['sbp'] = function(args, kwargs, meta) 

    quarto.doc.add_html_dependency({
      name = 'swissbiopics',
      scripts = {'resources/js/small-zone.js'},
      stylesheets = {'resources/css/biopicszone.css'}
    })

    quarto.log.output("=== Handling SBP ===")
    local user = pandoc.utils.stringify(args[1])
    quarto.log.output(user)
    local localdir = getlocaldir()
    quarto.log.output(localdir)
    local local_svg = localdir .. "resources/images/Animal_cells.svg"
    quarto.log.output(local_svg)
    local svg_string = readAll(local_svg)
    svg_string2 = pandoc.Str(svg_string)
    local wrapped = f("<div class=\"sbp\" data-name=\"Animal_cells.svg\"> <div id=\"cell\"> ${content} </div></div>", {content=pandoc.utils.stringify(svg_string)})
    return pandoc.RawBlock(
      'html', wrapped)

  end
}