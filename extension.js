// V86 Scratch Extension
// Load as an UNSANDBOXED extension.
//
// Expected files:
//   extension.js
//   v86/libv86.js
//   v86/v86.wasm
//   v86/bios/seabios.bin
//   v86/bios/vgabios.bin
//
// You also need to provide an OS image, for example:
//   images/linux.iso
//
// V86: https://github.com/copy/v86

class V86Scratch {
    constructor(runtime) {
        this.runtime = runtime;
        this.emulator = null;
        this.screen = null;
        this.container = null;

        this._makeUI();
    }

    getInfo() {
        return {
            id: 'v86',
            name: 'V86 Computer',
            color1: '#5B4BDB',
            color2: '#4939C7',
            color3: '#382AA8',

            blocks: [
                {
                    opcode: 'start',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'start computer with OS [URL]',
                    arguments: {
                        URL: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'images/linux.iso'
                        }
                    }
                },

                {
                    opcode: 'stop',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'stop computer'
                },

                {
                    opcode: 'reset',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'reset computer'
                },

                {
                    opcode: 'pause',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'pause computer'
                },

                {
                    opcode: 'resume',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'resume computer'
                },

                {
                    opcode: 'key',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'press key [KEY]',
                    arguments: {
                        KEY: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'ENTER'
                        }
                    }
                },

                {
                    opcode: 'type',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'type [TEXT]',
                    arguments: {
                        TEXT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'Hello from Scratch!'
                        }
                    }
                },

                {
                    opcode: 'computerRunning',
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: 'computer is running?'
                },

                {
                    opcode: 'saveState',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'save computer state'
                },

                {
                    opcode: 'restoreState',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'restore computer state'
                }
            ]
        };
    }

    _makeUI() {
        // Create a visible emulator window.
        this.container = document.createElement('div');

        this.container.id = 'scratch-v86-container';

        Object.assign(this.container.style, {
            position: 'fixed',
            left: '20px',
            top: '20px',
            width: '640px',
            height: '480px',
            background: '#000',
            border: '3px solid #5B4BDB',
            borderRadius: '8px',
            zIndex: '999999',
            overflow: 'hidden',
            display: 'none'
        });

        this.screen = document.createElement('div');

        Object.assign(this.screen.style, {
            width: '100%',
            height: '100%',
            background: '#000'
        });

        this.container.appendChild(this.screen);
        document.body.appendChild(this.container);
    }

    async _loadV86() {
        if (window.V86Starter) {
            return;
        }

        await new Promise((resolve, reject) => {
            const script = document.createElement('script');

            script.src = 'v86/libv86.js';

            script.onload = resolve;
            script.onerror = () => {
                reject(new Error('Could not load V86.'));
            };

            document.head.appendChild(script);
        });
    }

    async start(args) {
        const url = String(args.URL);

        // Stop an existing machine.
        this.stop();

        await this._loadV86();

        this.container.style.display = 'block';

        this.emulator = new V86Starter({
            wasm_path: 'v86/v86.wasm',

            memory_size: 128 * 1024 * 1024,
            vga_memory_size: 8 * 1024 * 1024,

            screen_container: this.screen,

            bios: {
                url: 'v86/bios/seabios.bin'
            },

            vga_bios: {
                url: 'v86/bios/vgabios.bin'
            },

            cdrom: {
                url: url,
                async: false
            },

            autostart: true,

            // Give the guest a virtual network adapter.
            network_relay_url: ''
        });
    }

    stop() {
        if (!this.emulator) {
            return;
        }

        if (typeof this.emulator.stop === 'function') {
            this.emulator.stop();
        }

        this.emulator = null;

        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    reset() {
        if (!this.emulator) {
            return;
        }

        if (typeof this.emulator.restart === 'function') {
            this.emulator.restart();
        }
    }

    pause() {
        if (!this.emulator) {
            return;
        }

        if (typeof this.emulator.stop === 'function') {
            this.emulator.stop();
        }
    }

    resume() {
        if (!this.emulator) {
            return;
        }

        if (typeof this.emulator.run === 'function') {
            this.emulator.run();
        }
    }

    key(args) {
        if (!this.emulator) {
            return;
        }

        const key = String(args.KEY).toUpperCase();

        // Common PC keys.
        const keyMap = {
            ENTER: 0x1C,
            ESC: 0x01,
            ESCAPE: 0x01,
            BACKSPACE: 0x0E,
            TAB: 0x0F,
            SPACE: 0x39,
            SHIFT: 0x2A,
            CTRL: 0x1D,
            ALT: 0x38,
            UP: 0x48,
            DOWN: 0x50,
            LEFT: 0x4B,
            RIGHT: 0x4D,
            F1: 0x3B,
            F2: 0x3C,
            F3: 0x3D,
            F4: 0x3E,
            F5: 0x3F,
            F6: 0x40,
            F7: 0x41,
            F8: 0x42,
            F9: 0x43,
            F10: 0x44,
            F11: 0x57,
            F12: 0x58
        };

        if (keyMap[key] !== undefined) {
            this.emulator.keyboard_send_scancodes([
                keyMap[key],
                keyMap[key] | 0x80
            ]);

            return;
        }

        // Basic A-Z support.
        if (/^[A-Z]$/.test(key)) {
            const scanCodes = {
                A: 0x1E,
                B: 0x30,
                C: 0x2E,
                D: 0x20,
                E: 0x12,
                F: 0x21,
                G: 0x22,
                H: 0x23,
                I: 0x17,
                J: 0x24,
                K: 0x25,
                L: 0x26,
                M: 0x32,
                N: 0x31,
                O: 0x18,
                P: 0x19,
                Q: 0x10,
                R: 0x13,
                S: 0x1F,
                T: 0x14,
                U: 0x16,
                V: 0x2F,
                W: 0x11,
                X: 0x2D,
                Y: 0x15,
                Z: 0x2C
            };

            const code = scanCodes[key];

            if (code !== undefined) {
                this.emulator.keyboard_send_scancodes([
                    code,
                    code | 0x80
                ]);
            }
        }
    }

    type(args) {
        if (!this.emulator) {
            return;
        }

        const text = String(args.TEXT);

        // V86 exposes keyboard input through its emulator API.
        //
        // For production, this should use V86's keyboard event/scancode
        // handling rather than trying to emulate every character manually.
        for (const character of text) {
            this._typeCharacter(character);
        }
    }

    _typeCharacter(character) {
        if (!this.emulator) {
            return;
        }

        // Let the browser/V86 keyboard system handle printable characters.
        //
        // Dispatching a KeyboardEvent is useful with versions/configurations
        // where the V86 screen has keyboard listeners installed.
        const event = new KeyboardEvent('keydown', {
            key: character,
            bubbles: true,
            cancelable: true
        });

        this.screen.dispatchEvent(event);

        const up = new KeyboardEvent('keyup', {
            key: character,
            bubbles: true,
            cancelable: true
        });

        this.screen.dispatchEvent(up);
    }

    computerRunning() {
        return !!this.emulator;
    }

    async saveState() {
        if (!this.emulator) {
            return;
        }

        const state = await this.emulator.save_state();

        // Store it in memory for this Scratch session.
        this.savedState = state;
    }

    async restoreState() {
        if (!this.emulator || !this.savedState) {
            return;
        }

        await this.emulator.restore_state(this.savedState);
    }
}

Scratch.extensions.register(new V86Scratch());
