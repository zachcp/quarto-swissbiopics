# Swissbiopics Extension For Quarto

Embed [Swissbiopics](https://www.swissbiopics.org/) in Quarto documents.


Note: this works but is still in alpha state.


## Installing

```bash
quarto add zachcp/swissbiopics
```

This will install the extension under the `_extensions` subdirectory.
If you're using version control, you will want to check in this directory.

## Using

You can use the `{{< sbp >}}` shortcode to add a SwissBioPics image to your quarto document. You will need to specify the name of one of the images which can be found in `_extensions/swissbiopics/resources/images`. For example:

```qmd
{{<  sbp Animal_cells >}}

{{<  sbp Egg_cell >}}

{{<  sbp Trypanosoma >}}
```



## Example

Here is the source code for a minimal example: [example.qmd](example.qmd).

