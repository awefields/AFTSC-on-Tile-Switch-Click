Hooks.on("ready", () => {
  console.log("Scene Switcher | Ready");

  // Hook for tile clicks
  setupTileClicks();

  // Enable drag & drop from scene sidebar
  if (game.user.isGM) {
    setupSceneDragDrop();
  }
});

function setupTileClicks() {
  canvas.tiles.placeables.forEach(tile => {
    const flag = tile.document.getFlag("scene-switcher", "targetScene");
    if (!flag) return;

    tile.on('click', () => {
      const scene = game.scenes.get(flag);
      if (!scene) {
        ui.notifications.error("Target scene not found.");
        return;
      }
      scene.view();
    });
  });
}

function setupSceneDragDrop() {
  // Override canvas drop handler for scenes
  const originalHandleDrop = canvas._onDrop.bind(canvas);

  canvas._onDrop = async function(event) {
    const data = event.dataTransfer.getData("text/plain");
    if (!data) return originalHandleDrop(event);

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      return originalHandleDrop(event);
    }

    // Only handle scene drops
    if (parsed.type !== "Scene") {
      return originalHandleDrop(event);
    }

    const scene = game.scenes.get(parsed.uuid?.split(".")[1]);
    if (!scene) {
      ui.notifications.error("Scene not found.");
      return;
    }

    // Get canvas drop position
    const dropPosition = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.tiles);

    // Create a tile with the scene-switcher flag
    await TileDocument.create({
      img: scene.background.src || scene.img || "icons/svg/map.svg",
      x: dropPosition.x,
      y: dropPosition.y,
      width: 128,
      height: 128,
      flags: {
        "scene-switcher": {
          targetScene: scene.id
        }
      }
    }, { parent: canvas.scene });

    ui.notifications.info(`Created scene switch tile for "${scene.name}"`);
  };
}