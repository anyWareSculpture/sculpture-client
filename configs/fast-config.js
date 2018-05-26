anyware_config = {
  DEBUG: {
    status: true,      // Persistent status icons
    debugView: true,   // Show game debug view
    console: false,    // Javascript console debug output
  },

  // The sequence of the games to be run. The first game is run on startup
  GAMES_SEQUENCE: [ "mole", "disk", "simon", ],

  MOLE_GAME: {
    GAME_END: 3,
  },

  DISK_GAME: {
    LEVELS: [
      { rule: 'absolute', disks: { disk0: -10, disk1: 10, disk2: 10 } },
    ],
  },

  SIMON_GAME: {
    PATTERN_LEVELS: [
      // level 0 sequence
      {
        stripId: '2',
        // Each array of panel IDs is lit up one at a time
        // Each array within this array is called a "frame" in the "sequence"
        panelSequences: [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ],
        frameDelay: 750 // Overriding default frame delay to make first level slower
      },
    ],
  }
};
