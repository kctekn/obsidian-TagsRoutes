# obsidian-TagsRoutes
This is a plugin for obsidian, to visualize files and tags as nodes in 3D graph.




<img src="https://github.com/kctekn/obsidian-TagsRoutes/assets/32674595/b2c78905-3b8c-4a44-a5a4-7577d4f0d869">

<video width="320" height="240" controls>
  <source src="https://github.com/kctekn/obsidian-TagsRoutes/assets/32674595/b2c78905-3b8c-4a44-a5a4-7577d4f0d869" type="video/mp4">
  您的浏览器不支持HTML5视频。
</video>

<img src="https://github.com/kctekn/obsidian-TagsRoutes/assets/32674595/a4d3845d-13f7-4d6b-8555-7a37cb5a7ade" width="100" height="100">

This plugin provides a comprehensive graph view to visualize the relationships between files, file-tag connections, and inter-tag connections within Obsidian. It is particularly useful for users who manage extensive thoughts and ideas with numerous tags in Obsidian.

### Features: 
 
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

### Additional Functionalities: 
 
- **Orphan File Linking** : 
  - Connect all orphan files, making them easier to review. Note that orphan files are not necessarily useless but are:
    - Non-markdown files with no links to other files.

    - For example, they could be isolated images from copy/paste operations or various collected items.
 
- **Orphan Excalidraw File Linking** :
  - Connect all orphan Excalidraw files that are not linked by any markdown files, simplifying their review.

### Interactive Features: 
 
- **Node Interaction** :
  - Click on a file node to open it in the editor, regardless of its file type.
 
  - Click on a tag node to generate a query result for that tag, displayed in a file in the editor.
    - Requires the Dataview plugin.

    - Provides a clear view of the tag's content by capturing the surrounding lines until a blank line is encountered, showing the entire paragraph containing the tag.
 
- **Graph Focus** :
  - Clicking on any file to open it in the editor will automatically focus the graph on its node.

  - Clicking on a tag in Obsidian's "Reading Mode" will focus on the tag node in the graph.

This allows you to clearly understand the status of files and tags through:

- The file’s link status

- The tags contained within the file

### Adjustable Settings: 

- Focus distance on a node

- Toggle tag query result page

- Toggle log page
 
- Display styles:
  - Link distance and width

  - Link particle size, number, and color

  - Node size and repulsion
