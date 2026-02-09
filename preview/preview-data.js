window.PREVIEW_DATA = {
  window: {
    title: ".ftgs hub  |  WindUI Example",
    tags: [
      { title: "v1.6.64" },
      { title: "github" }
    ],},
  tabs: [
    {
      title: "About WindUI",
      section: "Main",
      items: [
        { type: "image", src: "../docs/ui.png" },
        { type: "section", title: "What is WindUI?" },
        {
          type: "paragraph",
          title: "WindUI",
          desc: "WindUI is a stylish, open-source UI library designed for Roblox Script Hubs. It provides a modern, customizable toolkit for visually appealing interfaces."
        },
        { type: "button", title: "Export WindUI JSON (copy)" },
        { type: "button", title: "Destroy Window" }
      ]
    },
    {
      title: "Elements",
      section: "Main",
      items: [
        { type: "section", title: "Overview" },
        { type: "button", title: "Button 1" },
        { type: "button", title: "Button 2" },
        { type: "toggle", title: "Toggle 2", value: true, typeValue: "Toggle" },
        { type: "colorpicker", title: "Colorpicker 3", value: "#30ff6a" },
        { type: "divider" },
        { type: "input", title: "Input", placeholder: "Enter text" },
        { type: "textarea", title: "Input Textarea", placeholder: "Enter text" },
        { type: "slider", title: "Slider Example", value: 50, min: 0, max: 100, step: 1 },
        { type: "dropdown", title: "Advanced Dropdown", options: ["New file", "Copy link", "Edit file", "Delete file"] }
      ]
    }
  ]
};

