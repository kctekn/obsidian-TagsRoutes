# Obsidian plugin: TagsRoutes
<div align="left">
<img alt="GitHub Release" src="https://img.shields.io/github/downloads/kctekn/obsidian-TagsRoutes/total?logo=github&&color=%23a8baff">
<img alt="GitHub Release" src="https://img.shields.io/github/v/release/kctekn/obsidian-TagsRoutes?color=%23a8baff">
</div>

This is a plugin for obsidian, to visualize files and tags as nodes in 3D graphic.

<img width="40%" src="https://github.com/user-attachments/assets/27d000e5-fc97-4b53-ac6f-a5ed9a14aea0">

## Version 1.0.6 Release Notes

This release brings two key improvements to enhance your user experience:

**1. Focused Node View:**

- You can now toggle between a global and local view while focusing on a specific node.
- **Local view:**  Hides non-focused nodes, allowing you to concentrate on the selected node and its immediate connections. This declutters the scene and provides a clearer picture of the focused area.
- **Global view:** Displays all nodes as usual.
-  Switch between these views easily to analyze your data from different perspectives.

**2. Streamlined Interface:**

- The settings icon in the top right corner has been replaced with a more intuitive cycling button. 
- Click the button repeatedly to cycle through four different stages or functionalities. This change simplifies the interface and reduces visual clutter.


These updates aim to provide a more focused and efficient user experience. We hope you enjoy the improvements!


 _**Watch this short demo to learn how to use these new features:**_ 
 
<img width="50%" src="https://github.com/kctekn/obsidian-TagsRoutes/blob/main/usage/node-highlight.gif">


## What's New on version 1.0.5

1. **Multiple Slots for Display Settings**
   - You now have 5 slots to save your display settings. This allows you to quickly switch between them by dragging the slider.
     - So it likes that you have 5 themes to switch for better showing the graph in instance.
2. **Improved Query Function**
   - The query function is now handled by a custom code block processor, eliminating the need for DataviewJS.
     - You can now delete the `scripts/tag-report.js` file and the `scripts` folder from your vault.

3. **Enhanced Tag Interaction**
   - Clicking on a tag to focus on a node in the graph now works in edit mode as well.

4. **Other Fixes**
   - Fix a ficker issue might occure, Refer here: https://github.com/kctekn/obsidian-TagsRoutes/issues/2  Thanks @ShaneNZ for the feecback.

# How to operate:
https://github.com/kctekn/obsidian-TagsRoutes/assets/32674595/2c37676c-f307-4a74-9dae-0679067cbae7



https://github.com/kctekn/obsidian-TagsRoutes/assets/32674595/759e9cba-c729-4b3e-a0c4-bb4c4f1b5dd1






This plugin provides a comprehensive graph view to visualize the relationships between files, file-tag connections, and inter-tag connections within Obsidian. **It is particularly useful for users who manage extensive thoughts and ideas with numerous tags in Obsidian.**

# Features: 
 
- **Node and Link Visualization** :
  - Display all files and their links.
 
  - Display all tags and their connections, including:
    - Tag-to-tag links

    - Tag-to-file links

    - File-to-file links
 
- **Dynamic Node Sizing** :
  - Adjust the size of file nodes based on the number of links.

  - Adjust the size of tag nodes based on their frequency of appearance.

This approach helps you identify the most significant parts of your vault at a glance.

# Additional Functionalities: 
 
- **Orphan File Linking** : 
  - Connect all orphan files, making them easier to review. Note that orphan files are not necessarily useless but are:
    - Non-markdown files with no links to other files.

    - For example, they could be isolated images from copy/paste operations or various collected items.
 
- **Orphan Excalidraw File Linking** :
  - Connect all orphan Excalidraw files that are not linked by any markdown files, simplifying their review.

# Interactive Features: 
 
- **Node Interaction** :
  - Click on a file node to open it in the editor, regardless of its file type.
 
  - Click on a tag node to generate a query result for that tag, displayed in a file in the editor.
    - Provides a clear view of the tag's content by capturing the surrounding lines until a blank line is encountered, showing the entire paragraph containing the tag.
 
- **Graph Focus** :
  - Clicking on any file to open it in the editor will automatically focus the graph on its node.

  - Clicking on a tag in Obsidian's "Reading Mode" will focus on the tag node in the graph.

This allows you to clearly understand the status of files and tags through:

- The file’s link status

- The tags contained within the file

# Adjustable Settings: 

- Focus distance on a node

- Toggle tag query result page

- Toggle log page
 
- Display styles:
  - Link distance and width
  - Link particle size, number, and color
  - Node size and repulsion


# Install
- Search for "Tags routes" in Obsidian's community plugins browser, or you can find it [HERE](https://obsidian.md/plugins?search=tags%20routes).
- Choose to intall it.
- You can also install it manually:
	- Download the release file, and extract to your obsidian's: valut/.obsidian/plugin/tags-routes.
- Enable it in obsidian settings tab.

# Acknowledgements

I would like to extend my sincere gratitude to the following projects, which provided invaluable resources and inspiration for this plugin:

- [obsidian-3d-graph](https://github.com/AlexW00/obsidian-3d-graph/tree/master) by AlexW00
- [3d-force-graph](https://github.com/vasturiano/3d-force-graph) by vasturiano
