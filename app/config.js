anyware_config = {
  DEBUG: {
    status: false,     // Persistent status icons
    debugView: false,  // Show game debug view
    console: false,    // Javascript console debug output
  },

    // The sequence of the games to be run. The first game is run on startup
  GAMES_SEQUENCE: [ "mole", "disk", "simon", ],

  // These settings effect the default behaviour of panels outside of
  // any custom logic in any of the games
  PANEL_DEFAULTS: {
    ACTIVE_INTENSITY: 100,
    INACTIVE_INTENSITY: 0
  },

  /******* GAMES CONFIGURATION *******/

  HANDSHAKE: {
    TRANSITION_OUT_TIME: 4000 // Time (ms) from handshake is touched until we start the next game
  },

  MOLE_GAME: {
    GAME_END: 30, // Game ends after this number of panels have been touched
    INITIAL_PANELS: [
      {stripId: '2', panelId: '3'},
      {stripId: '2', panelId: '7'},
      {stripId: '1', panelId: '6'},
      {stripId: '0', panelId: '5'}
    ],
    NUM_ACTIVE_PANELS: {
//        10: 1, // At panelCount of 10, increase # of simultaneusly active panels
//        20: 1,
//        25: -1, // At panelCount of 25, decrease # of simultaneusly active panels
//        27: -1
    },
    PANEL_LIFETIME: [
      {count: 0, range: [10, 10]}, // Initial timeout
      {count: 4, range: [4, 6]}, // At panelCount of 4, set panel lifetime to 4-6 seconds. Gradually interpolate to next timeout level
      {count: 20, range: [2, 3]},
      {count: 30, range: [1.5, 2]}
    ],
    // How long to wait before enabling the next panel, on success
    PANEL_SUCCESS_DELAY: 1000,
    // How long to wait before enabling the next panel, on automatic panel move
    PANEL_MOVE_DELAY: 500,
    // The intensity to use on active panels
    ACTIVE_PANEL_INTENSITY: 100,
    // The intensity to use on inactive panels
    INACTIVE_PANEL_INTENSITY: 0,
    // The intensity to use on ignored panels (panels turned to location color)
    COLORED_PANEL_INTENSITY: 75,
    // We don't use failure sounds in the default setup due to too many accidental touches
    ENABLE_FAILURE_SOUND: false
  },

  DISK_GAME: {
    SPEEDS: [6, 15, 21, 30, 72], // degrees/sec
    ABSOLUTE_TOLERANCE: 8, // sum of degrees tolerance for the absolute disk positions
    // The intensity of the panels that the user can use to play the sequence
    CONTROL_PANEL_COLOR: 'white',
    CONTROL_PANEL_INTENSITIES: [10, 20, 30, 40, 50],
    CONFLICT_INTENSITY: 20,
    ACTIVE_CONTROL_PANEL_INTENSITY: 100,
    SHADOW_LIGHTS: {
      // stripId: [panelId..]
      '6': ['0', '1', '2', '3']
    },
    SHADOW_LIGHT_INTENSITY: 100,
    LEVELS: [
      // rule: 'absolute' or 'relative'
      // disks: { diskId: initial position }
      
      // level 0
      { rule: 'absolute', disks: { disk0: -90, disk1: 90, disk2: 120 } },
      
      // level 1
      { rule: 'relative', disks: { disk0: 90, disk1: -90, disk2: -120 } },
      
      // level 2
      { rule: 'absolute', disks: { disk0: 180, disk1: 45, disk2: -90 } },
      
    ],
    CONTROL_MAPPINGS: {
      STRIP_TO_DISK: {
        '0': 'disk0',
        '1': 'disk1',
        '2': 'disk2',
      },
    }
  },

  SIMON_GAME: {
    PATTERN_LEVELS: [
      // level 0 sequence
      {
        stripId: '0',
        // Each array of panel IDs is lit up one at a time
        // Each array within this array is called a "frame" in the "sequence"
        panelSequences: [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ],
        frameDelay: 750 // Overriding default frame delay to make first level slower
      },
      // level 1 sequence
      {
        stripId: '1',
        panelSequences: [
          ['1', '8', '6'],
          ['2', '7', '0'],
          ['4', '9', '5'],
        ],
      },
      // level 2 sequence
      {
        stripId: '2',
        panelSequences: [
          ['3', '6', '2', '9'],
          ['5', '1', '8', '7'],
          ['0', '4', '7', '6'],
        ],
      }
    ],
    // The intensity of the panels when they are pressed or when the sequence is playing
    TARGET_PANEL_INTENSITY: 100,
    // The intensity of the panels that the user can use to play the sequence
    AVAILABLE_PANEL_INTENSITY: 1,
    // The delay in ms between sequence frames
    SEQUENCE_ANIMATION_FRAME_DELAY: 500,
    // The delay in ms to wait before replaying the sequence
    // Only replayed if no input is received from the user
    DELAY_BETWEEN_PLAYS: 5000,
    // The time after input to wait for the user to finish the sequence
    INPUT_TIMEOUT: 10000,
    // The default color to set the panels to when
    DEFAULT_SIMON_PANEL_COLOR: 'white',
    // Wait while playing final sound
    TRANSITION_OUT_TIME: 10000
  }
};
