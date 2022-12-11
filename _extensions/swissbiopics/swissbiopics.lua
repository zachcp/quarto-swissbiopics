local open = io.open


function readAll(file)
  local f = assert(io.open(file, "r"))
  local content = f:read("*all")
  f:close()
  return content
end

function getlocaldir()
  local fullpath = debug.getinfo(1,"S").source:sub(2)
  -- quarto.log.output(fullpath)
  fullpath = io.popen("realpath '"..fullpath.."'", 'r'):read('a')
  -- quarto.log.output(fullpath)
  fullpath = fullpath:gsub('[\n\r]*$','')
  -- quarto.log.output(fullpath)
  local dirname, filename = fullpath:match('^(.*/)([^/]-)$')
  -- quarto.log.output(dirname)
  return dirname
end


return {
  ['sbp'] = function(args, kwargs, meta) 
    quarto.log.output("=== Handling SBP ===")
    local user = pandoc.utils.stringify(args[1])
    quarto.log.output(user)
    local localdir = getlocaldir()
    quarto.log.output(localdir)
    local local_svg = localdir .. "resources/images/Animal_cells.svg"
    quarto.log.output(local_svg)
    local svg_string = readAll(local_svg)

    -- quarto.log.output()
    -- local content = file:read "*a" -- *a or *all reads the whole file
    -- quarto.log.output(content)
    -- file:close()

    -- local svg_file = read_file(local_svg)
    -- local svg_string = pandoc.utils.stringify(svg_file)
    -- quarto.log.output(svg_file)
    -- quarto.log.output(svg_string)
    -- local svg_string = pandoc.utils.stringify(svg_file)
    -- quarto.log.output(svg_string)
  
  
    -- return pandoc.Str("Hello from Shorty!")
    -- return pandoc.Str(svg_string)
    -- return pandoc.Str(svg_string)
    return pandoc.RawBlock(
      'html', svg_string)

  end
}