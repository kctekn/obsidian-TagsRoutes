# Obsidian plugin: TagsRoutes
<div align="left">
<img alt="GitHub Release" src="https://img.shields.io/github/downloads/kctekn/obsidian-TagsRoutes/total?logo=github&&color=%23a8baff">
<img alt="GitHub Release" src="https://img.shields.io/github/v/release/kctekn/obsidian-TagsRoutes?color=%23a8baff">
</div>

This is a plugin for obsidian, to visualize files and tags as nodes in 3D graphic.
![title](https://github.com/user-attachments/assets/4033af48-3dd7-4cbf-948f-02a03cf29189)


<img1 width="40%" src="https://github.com/user-attachments/assets/27d000e5-fc97-4b53-ac6f-a5ed9a14aea0">

Wiki:

[Organize Tags by Timestamp Using the Obsidian Plugin: "Tags Routes"](https://github.com/kctekn/obsidian-TagsRoutes/wiki/Organize-Tags-by-Timestamp-Using-the-Obsidian-Plugin:-%22Tags-Routes%22)

[Organize Tags with Hierarchy Using the Obsidian Plugin "Tags Routes"](https://github.com/kctekn/obsidian-TagsRoutes/wiki/Organize-Tags-with-Hierarchy-Using-the-Obsidian-Plugin-%22Tags-Routes%22)

And you can show up your beautiful vault pictures here: [Share & showcase](https://github.com/kctekn/obsidian-TagsRoutes/discussions/17)

## Version 1.1.3 Release Notes
 
 This release introduces major updates to screenshots, enhancements to graph display control, and provides more choice in how you interact with tags nodes.
 
**1. Major Updates:**

* **Screenshot Functionality:** Capture your current graph as an image! You can now save the graph as a picture and insert it directly into your note or save it to a designated snapshot folder.
* **New "Screenshot" Node Type:** A new node type dedicated to screenshots has been added. Customize its color and use it to easily manage and check for orphan files.

**2. Graph Display Enhancements:**

* **Adjustable Node Label Color:**  Easily adjust the color of node labels using a slider. This allows you to automatically find a clear and readable text color against the background.
* **Tunable Bloom in Dark Mode:** Fine-tune the bloom strength in dark mode for optimal visual appeal.
* **Lock Node Positions:** Lock the position of nodes to improve performance, especially on lower-end devices.
* **Disable Link Particles:** Set the link particle number to 0 to disable the particle effect and boost performance.
* **New "Track" Highlight Mode:** Introducing a new highlight mode called "Track." When enabled, clicking a node will highlight all directly and indirectly connected nodes, allowing you to easily visualize sub-networks within your larger graph.

**3. Choice of Tags Node Interaction:**

* **Enable/Disable Tags Query:** Choose whether to enable the tag query function when clicking on tag nodes. Disable this feature if you don't rely on tags for note management.
* **"TagsRoutes" Folder Removal:** If you disable the following three options:
    * 'Log node/link Count'
    * 'Show log file on Startup'
    * 'Enable tag click action '
    
	You can safely delete the 'TagsRoutes' folder in your vault, as the plugin will no longer utilize it.

_*The usage demo:*_

<img src="https://github.com/kctekn/obsidian-TagsRoutes/blob/main/usage/v1.1.3-feature.gif">

## Version 1.1.1/1.1.2 Release Notes

1. **Improved Orphan File Detection**
    - Enhanced algorithm to identify unlinked files:
      - Files are now flagged as orphaned if they are not referenced by any other markdown file.
    - New feature: Easily select and link orphaned files within the application.

2. **Added Support for PDF Files**:
    - The application now supports linking and managing PDF file types.

3. **Bug Fixes**:
    - Resolved various issues related to linking files within the scene.

4. **New Quick Focus Function**:
    - Right-clicking on a node in the scene now triggers a "quick focus" behavior for easier navigation.

### Version 1.1.2 Bug Fix Release

1. Color Map Source Update Issue: The color map source now correctly updates when the color is reset.
2. Label Text Display Issue: The label text now displays correctly when toggled off.
3. Unwanted Border Issue: An issue causing an unwanted border to appear in certain scenarios has been resolved.

_*The usage demo:*_

<img src="https://github.com/kctekn/obsidian-TagsRoutes/blob/main/usage/v1.1.1-feature.gif">

_*Settings of the demo:*_
1. Obsidian theme: "80s Neon" - dark mode
2. Plugin theme: default settings - dark mode
3. Toggle global map: off
4. Toggle label display: on

## Version 1.1.0 Release Notes

I'm excited to announce the release of Version 1.1.0, which includes several new features and improvements to enhance your experience:

### Major Updates:

1. **Light Theme Added**:
    
    - Introduced a new light theme with a bright background and distinct visual elements, offering an alternative to the dark theme.
  <img width="40%" src="https://github.com/kctekn/obsidian-TagsRoutes/blob/main/usage/v1.1.0-defaultLightTheme.gif">
      
2. **Node Color Synchronization with Obsidian**:
    
    - You can now import node colors directly from Obsidian:
        1. Node colors will sync with Obsidian's graph view.
        2. You can switch between different Obsidian themes and:
            - **Apply Theme Colors**: Import the color scheme of the selected theme.
            - **Save Slot**: Save the imported color scheme into a slot for future use.
        3. The saved color schemes can be reused across different modes (light/dark) and themes, as long as the corresponding slot is loaded.

### New Features:

3. **Enhanced Node Interaction**:
    
    - Clicking on frontmatter tags within a note will now focus on the corresponding node in the scene, consistent with other clickable elements.
4. **User-Friendly Tooltip Bar**:
    
    - A new tooltip bar has been added to guide new users on how to navigate and operate the interface. Special thanks to @RealSourceOfficial for his support in this addition.
5. **Node Label Display Toggle**:
    
    - A new toggle in the settings allows you to turn off node label displays. This is particularly useful if there are too many labels cluttering the view or if you don't need to see note labels constantly.
6. **Improved Node Label Interaction**:
    
    - Node labels will no longer respond to mouse clicks, making it easier to interact directly with the nodes.
7. **Settings Box Style Update**:
    
    - The settings box style has been updated to match the current Obsidian theme, ensuring a more cohesive visual experience.

These updates significantly enhance customization options, improve user experience, and provide better integration with Obsidian's theming system. I hope you enjoy the new features and improvements!

_**You can check the simple usage demo here:**_

<img width="50%" src="https://github.com/kctekn/obsidian-TagsRoutes/blob/main/usage/v1.1.0-usage.gif">



# More
**Full version history please refer to [What's-new-history](https://github.com/kctekn/obsidian-TagsRoutes/wiki/What's-new-history)**

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

# More

**For more information,please refer to [What's-new-history](https://github.com/kctekn/obsidian-TagsRoutes/wiki/What's-new-history) and [Discussions](https://github.com/kctekn/obsidian-TagsRoutes/discussions)**

