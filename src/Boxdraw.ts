import * as vscode from "vscode";
var eaw = require("eastasianwidth");

/** direction type */
type Direction = "up" | "right" | "down" | "left";

/** boxdraw-extesnion class */
class Boxdraw {
  // constant

  /** application id for vscode */
  private appId = "boxdraw";

  // context

  /** flag for boxdaw */
  public mode: boolean;
  /** flag for block */
  public block: boolean;
  /** flag for debug  */
  public debug: boolean;
  /** flag for isexecuting */
  private isExecuting: boolean;

  // vscode

  /** channel on vscode */
  public channel: vscode.OutputChannel;
  /** statusvar on vscode */
  public statusBarItem: vscode.StatusBarItem;
  /** config */
  public get config() {
    return vscode.workspace.getConfiguration(this.appId);
  }

  // data

  /** mapping array for code and char */
  public static boxchars: { char: string; val: number }[] = [
    { val: 0b00000000, char: "  " },
    { val: 0b00000011, char: "└" },
    { val: 0b00000101, char: "│" },
    { val: 0b00000110, char: "┌" },
    { val: 0b00000111, char: "├" },
    { val: 0b00001001, char: "┘" },
    { val: 0b00001010, char: "─" },
    { val: 0b00001011, char: "┴" },
    { val: 0b00001100, char: "┐" },
    { val: 0b00001101, char: "┤" },
    { val: 0b00001110, char: "┬" },
    { val: 0b00001111, char: "┼" },
    { val: 0b00000101, char: "↑" },
    { val: 0b00000101, char: "↓" },
    { val: 0b00001010, char: "→" },
    { val: 0b00001010, char: "←" },
  ];

  // method

  /** constructor */
  constructor() {}

  /** activate extension */
  public activate(context: vscode.ExtensionContext) {
    // init context
    this.channel = vscode.window.createOutputChannel(this.appId);
    this.channel.appendLine(`[${this.timestamp()}] ${this.appId} activated`);

    // init context
    this.mode = false;
    this.block = false;
    this.isExecuting = false;

    // init vscode

    // - command
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.toggleMode`, () => {
        boxdraw.toggleMode();
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.toggleBlock`, () => {
        boxdraw.toggleBlock();
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.transitionModes`, () => {
        boxdraw.transitionModes();
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.cursorUp`, () => {
        boxdraw.cursorUp();
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.cursorDown`, () => {
        boxdraw.cursorDown();
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.drawLeft`, () => {
        boxdraw.drawBox("left");
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.drawRight`, () => {
        boxdraw.drawBox("right");
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.drawUp`, () => {
        boxdraw.drawBox("up");
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.drawDown`, () => {
        boxdraw.drawBox("down");
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.drawLeftArrow`, () => {
        boxdraw.drawBox("left", true);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.drawRightArrow`, () => {
        boxdraw.drawBox("right", true);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.drawUpArrow`, () => {
        boxdraw.drawBox("up", true);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.drawDownArrow`, () => {
        boxdraw.drawBox("down", true);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.clearLeft`, () => {
        boxdraw.drawBox("left", false, true);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.clearRight`, () => {
        boxdraw.drawBox("right", false, true);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.clearUp`, () => {
        boxdraw.drawBox("up", false, true);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.clearDown`, () => {
        boxdraw.drawBox("down", false, true);
      })
    );

    // - statusbar
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.command = `${this.appId}.transitionModes`;
    this.statusBarItem.tooltip = this.appId;
    this.statusBarItem.show();
    context.subscriptions.push(this.statusBarItem);

    // - setcontext
    this.setMode(false, true);
    this.setBlock(false, true);
  }

  // public interface

  /** toggle mode */
  public toggleMode() {
    if (this.config.debug) this.channel.appendLine(`--------`);

    this.setMode(!this.mode);
  }

  /** toggle block */
  public toggleBlock() {
    if (this.config.debug) this.channel.appendLine(`--------`);

    this.setBlock(!this.block);
  }

  /** transition modes */
  public transitionModes() {
    if (this.config.debug) this.channel.appendLine(`--------`);

    if (!this.mode) {
      this.setMode(true);
      this.setBlock(false);
    } else if (!this.block) {
      this.setBlock(true);
    } else {
      this.setMode(false);
      this.setBlock(false);
    }
  }

  /** move to previous line */
  public async cursorUp() {
    try {
      if (this.config.debug) this.channel.appendLine(`--------`);

      // check editor and document exist
      const editor = vscode.window?.activeTextEditor;
      const document = editor?.document;
      if (!editor) return;
      if (!document) return;

      // previous line
      await editor.edit(() => {
        const cpoc = PosColumn.getCursor(); // current poscolum
        if (cpoc.line > 0) {
          cpoc.line--;
          const cpos = cpoc.toPosition(); // current position
          editor.selection = new vscode.Selection(cpos, cpos);
          vscode.commands.executeCommand("revealLine", { lineNumber: cpos.line });
        }
      });
    } catch (ex) {
      if (ex instanceof Error) {
        this.channel.appendLine(ex.stack);
      }
    }
  }

  /** move to next line */
  public async cursorDown() {
    try {
      if (this.config.debug) this.channel.appendLine(`--------`);

      // check editor and document exist
      const editor = vscode.window?.activeTextEditor;
      const document = editor?.document;
      if (!editor) return;
      if (!document) return;

      // next line
      await editor.edit(() => {
        const cpoc = PosColumn.getCursor(); // current poscolumn
        if (cpoc.line < document.lineCount - 1) {
          cpoc.line++;
          const cpos = cpoc.toPosition(); // current position
          editor.selection = new vscode.Selection(cpos, cpos);
          vscode.commands.executeCommand("revealLine", { lineNumber: cpos.line });
        }
      });
    } catch (ex) {
      if (ex instanceof Error) {
        this.channel.appendLine(ex.stack);
      }
    }
  }

  /** draw line, draw arrow, clear line */
  protected async drawBox(direction: Direction, isarrow = false, isclear = false) {
    // check executing
    if (this.isExecuting) {
      return;
    }
    this.isExecuting = true;

    try {
      if (this.config.debug) this.channel.appendLine(`--------`);
      if (this.config.debug) this.channel.appendLine(`[${this.timestamp()}] drawBox(${[...arguments]})`);

      // check editor and document exist
      const editor = vscode.window?.activeTextEditor;
      const document = editor?.document;
      if (!editor) return;
      if (!document) return;

      // check 1st cursor poscolumn
      const cpoc = PosColumn.getCursor(); // current poscolumn
      const ppoc = new PosColumn(cpoc.line - 1, cpoc.column); // prev poscolumn
      const npoc = new PosColumn(cpoc.line + 1, cpoc.column); // next poscolumn
      ppoc.toPosition();
      cpoc.toPosition();
      npoc.toPosition();

      if (this.config.debug)
        this.channel.appendLine(
          "- [" +
            ppoc.ptxt +
            "][" +
            ppoc.ctxt +
            "][" +
            ppoc.ntxt +
            "] " +
            ppoc.rbgnchr +
            ", " +
            ppoc.rbgnchr2 +
            ", " +
            ppoc.rendchr2 +
            ", " +
            ppoc.rendchr +
            "\n" +
            "- [" +
            cpoc.ptxt +
            "][" +
            cpoc.ctxt +
            "][" +
            cpoc.ntxt +
            "] " +
            cpoc.rbgnchr +
            ", " +
            cpoc.rbgnchr2 +
            ", " +
            cpoc.rendchr2 +
            ", " +
            cpoc.rendchr +
            "\n" +
            "- [" +
            npoc.ptxt +
            "][" +
            npoc.ctxt +
            "][" +
            npoc.ntxt +
            "] " +
            npoc.rbgnchr +
            ", " +
            npoc.rbgnchr2 +
            ", " +
            npoc.rendchr2 +
            ", " +
            npoc.rendchr
        );

      // check 1st position
      const pot = new PosText(ppoc, cpoc, npoc, direction, isarrow, isclear);
      pot.getReplaceText(true);
      if (pot.isReplaceOrNot()) {
        // draw 1st position
        await editor
          .edit(builder => {
            const rbpos = new vscode.Position(cpoc.line, cpoc.rbgnchr); // replace begin position
            const repos = new vscode.Position(cpoc.line, cpoc.rendchr); // replace end position
            const range = new vscode.Range(rbpos, repos);
            builder.replace(range, " ".repeat(cpoc.rbgnchr2) + pot.text + " ".repeat(cpoc.rendchr2));
          })
          .then(() => {
            const cpos = new vscode.Position(cpoc.line, cpoc.rbgnchr + cpoc.rbgnchr2); // current position
            editor.selection = new vscode.Selection(cpos, cpos);
            vscode.commands.executeCommand("revealLine", { lineNumber: cpos.line });
          });

        // exit if block mode
        if (boxdraw.block) return;

        // exit if no clear and no line;
        if (!isclear && pot.oval === 0) return;
      }

      // exit if arrow
      if (isarrow) return;

      // check move 2nd postion or not
      let isMoved = false;
      if (direction === "up") {
        if (cpoc.line >= 1) {
          isMoved = true;
          cpoc.line--;
          ppoc.line--;
          npoc.line--;
        }
      } else if (direction === "left") {
        if (cpoc.column >= 2) {
          isMoved = true;
          cpoc.column -= 2;
          ppoc.column -= 2;
          npoc.column -= 2;
        }
      } else if (direction === "down") {
        isMoved = true;
        cpoc.line++;
        ppoc.line++;
        npoc.line++;
      } else if (direction === "right") {
        isMoved = true;
        cpoc.column += 2;
        ppoc.column += 2;
        npoc.column += 2;
      }

      // exit if not moved 2nd position
      if (!isMoved) return;

      // check 2nd cursor poscolumn
      ppoc.toPosition();
      cpoc.toPosition(true);
      npoc.toPosition();

      if (this.config.debug)
        this.channel.appendLine(
          "- [" +
            ppoc.ptxt +
            "][" +
            ppoc.ctxt +
            "][" +
            ppoc.ntxt +
            "] " +
            ppoc.rbgnchr +
            ", " +
            ppoc.rbgnchr2 +
            ", " +
            ppoc.rendchr2 +
            ", " +
            ppoc.rendchr +
            "\n" +
            "- [" +
            cpoc.ptxt +
            "][" +
            cpoc.ctxt +
            "][" +
            cpoc.ntxt +
            "] " +
            cpoc.rbgnchr +
            ", " +
            cpoc.rbgnchr2 +
            ", " +
            cpoc.rendchr2 +
            ", " +
            cpoc.rendchr +
            "\n" +
            "- [" +
            npoc.ptxt +
            "][" +
            npoc.ctxt +
            "][" +
            npoc.ntxt +
            "] " +
            npoc.rbgnchr +
            ", " +
            npoc.rbgnchr2 +
            ", " +
            npoc.rendchr2 +
            ", " +
            npoc.rendchr
        );

      // check 2nd position
      pot.getReplaceText(false);
      if (pot.isReplaceOrNot()) {
        // draw 2nd position

        // check last line or not
        if (cpoc.line === document.lineCount) {
          // add new line
          await editor
            .edit(builder => {
              const line = document.lineAt(document.lineCount - 1);
              builder.insert(line.range.end, "\n" + " ".repeat(cpoc.column) + pot.text);
            })
            .then(() => {
              const cpos = new vscode.Position(cpoc.line, cpoc.column);
              editor.selection = new vscode.Selection(cpos, cpos);
              vscode.commands.executeCommand("revealLine", { lineNumber: cpos.line });
            });
          return;
        }

        // rewrite existing line
        await editor
          .edit(builder => {
            const posbgn = new vscode.Position(cpoc.line, cpoc.rbgnchr);
            const posend = new vscode.Position(cpoc.line, cpoc.rendchr);
            const range = new vscode.Range(posbgn, posend);
            builder.replace(range, " ".repeat(cpoc.rbgnchr2) + pot.text + " ".repeat(cpoc.rendchr2));
          })
          .then(() => {
            const cpos = new vscode.Position(cpoc.line, cpoc.rbgnchr + cpoc.rbgnchr2);
            editor.selection = new vscode.Selection(cpos, cpos);
            vscode.commands.executeCommand("revealLine", { lineNumber: cpos.line });
          });
        return;
      }

      // nothing to draw
      const cpos = new vscode.Position(cpoc.line, cpoc.rbgnchr + cpoc.rbgnchr2);
      editor.selection = new vscode.Selection(cpos, cpos);
      vscode.commands.executeCommand("revealLine", { lineNumber: cpos.line });
    } catch (ex) {
      if (ex instanceof Error) {
        this.channel.appendLine(ex.stack);
      }
    } finally {
      this.isExecuting = false;
    }
  }

  // inner interface

  /** set mode */
  public setMode(mode: boolean, force = false) {
    if (this.config.debug) this.channel.appendLine(`[${this.timestamp()}] setMode(${[...arguments]})`);

    if (this.mode !== mode || force) {
      this.mode = mode;
      vscode.commands.executeCommand("setContext", `${this.appId}Mode`, this.mode);
      this.updateStatusbar();
    }
  }

  /** set block */
  public setBlock(block: boolean, force = false) {
    if (this.config.debug) this.channel.appendLine(`[${this.timestamp()}] setBlock(${[...arguments]})`);

    if (this.block !== block || force) {
      this.block = block;
      vscode.commands.executeCommand("setContext", `${this.appId}Block`, this.block);
      this.updateStatusbar();
    }
  }

  /** update statusbar */
  public updateStatusbar() {
    if (this.config.debug) this.channel.appendLine(`[${this.timestamp()}] updateStatusbar(${[...arguments]})`);

    this.statusBarItem.backgroundColor = this.mode ? new vscode.ThemeColor("statusBarItem.errorBackground") : undefined;
    this.statusBarItem.text = "";
    this.statusBarItem.text += this.block ? "$(primitive-square)" : "$(edit)";
    this.statusBarItem.text += this.config.debug ? " debug" : "";
  }

  // utility

  /** return timestamp string */
  public timestamp(): string {
    return new Date().toLocaleString("ja-JP").split(" ")[1];
  }
}
export const boxdraw = new Boxdraw();

/** position with column */
class PosColumn {
  // property
  /** current line number */
  public line: number;
  /** current column number not character number*/
  public column: number;
  /** text of previous line */
  public ptxt: string;
  /** text of current position */
  public ctxt: string;
  /** text of next line */
  public ntxt: string;
  /** beginning character number for replace*/
  public rbgnchr: number;
  /** end character number for replace */
  public rendchr: number;
  /** before character number for replace */
  public rbgnchr2: number;
  /** after character number for replace */
  public rendchr2: number;

  /** constructor*/
  constructor(line: number, column: number) {
    // init property
    this.line = line;
    this.column = column;
    this.initProperty();
  }

  /** init property */
  protected initProperty() {
    this.ctxt = "";
    this.ptxt = "";
    this.ntxt = "";
    this.rbgnchr = 0;
    this.rbgnchr2 = 0;
    this.rendchr2 = 0;
    this.rendchr = 0;
  }

  /** get cursor cposition */
  public static getCursor(): PosColumn {
    if (boxdraw.config.debug) boxdraw.channel.appendLine(`[${boxdraw.timestamp()}] getCursor(${[...arguments]})`);

    const editor = vscode.window.activeTextEditor;
    const document = editor.document;
    const current = editor.selection.active;
    const bol = new vscode.Position(current.line, 0);
    const range = new vscode.Range(bol, current);
    const text = document.getText(range);
    const cpoc = new PosColumn(current.line, eaw.length(text));
    return cpoc;
  }

  /** poscolum to position */
  public toPosition(fulfill = false) {
    if (boxdraw.config.debug) boxdraw.channel.appendLine(`[${boxdraw.timestamp()}] getPosition(${[...arguments]})`);

    const editor = vscode.window.activeTextEditor;
    const document = editor.document;

    // init property
    this.initProperty();

    // validation
    if (this.line < 0) return null;
    if (this.line >= document.lineCount) return null;

    // get line
    const line = document.lineAt(this.line);

    // calc character begin
    const chars = line.text.split("");
    let column = 0;
    let character = 0;
    while (true) {
      if (column === this.column) {
        if (character > 0) this.ptxt = chars[character - 1];
        this.rbgnchr = character;
        this.rendchr = character;
        break;
      }
      if (column > this.column) {
        this.rbgnchr = character - 1;
        this.rendchr = character - 1;
        this.rbgnchr2 = 1;
        break;
      }
      if (character >= chars.length) {
        this.rbgnchr = character;
        this.rendchr = character;
        break;
      }
      column += eaw.characterLength(chars[character]);
      character++;
    }

    // calc character end
    while (true) {
      if (column === this.column + 2) {
        if (character < chars.length) this.ntxt = chars[character];
        this.rendchr = character;
        break;
      }
      if (column > this.column + 2) {
        this.rendchr = character;
        this.rendchr2 = 1;
        break;
      }
      if (character >= chars.length) {
        this.rendchr = character;
        break;
      }
      if (this.rbgnchr2 === 0) this.ctxt += chars[character];
      column += eaw.characterLength(chars[character]);
      character++;
    }

    // fulfill
    if (fulfill) {
      this.rbgnchr2 += column < this.column ? this.column - column : 0;
    }

    // return position
    const actchr = this.rbgnchr + this.rbgnchr2;
    const pos = new vscode.Position(this.line, actchr);
    return pos;
  }
}

/** position text */
class PosText {
  public ppoc: PosColumn;
  public cpoc: PosColumn;
  public npoc: PosColumn;
  public direction: Direction;
  public isarrow: boolean;
  public isclear: boolean;
  public oval: number;
  public cval: number;
  public text: string;

  /** constructor */
  constructor(ppoc: PosColumn, cpoc: PosColumn, npoc: PosColumn, direction: Direction, isarrow: boolean, isclear: boolean) {
    this.ppoc = ppoc;
    this.cpoc = cpoc;
    this.npoc = npoc;
    this.direction = direction;
    this.isarrow = isarrow;
    this.isclear = isclear;
  }

  /** text to replace */
  public getReplaceText(isfirst: boolean) {
    if (boxdraw.block) {
      if (this.isarrow) this.text = "□";
      else if (this.isclear) this.text = "  ";
      else this.text = "■";
      return this.text;
    } else {
      // arrow
      if (this.isarrow) {
        if (this.direction === "up") this.text = "↑";
        else if (this.direction === "right") this.text = "→";
        else if (this.direction === "down") this.text = "↓";
        else if (this.direction === "left") this.text = "←";
        else this.text = "";
        return this.text;
      }
      // calc value by neighbors
      const uval = Boxdraw.boxchars.find(x => x.char === this.ppoc.ctxt)?.val;
      const lval = Boxdraw.boxchars.find(x => x.char === this.cpoc.ptxt)?.val;
      const rval = Boxdraw.boxchars.find(x => x.char === this.cpoc.ntxt)?.val;
      const dval = Boxdraw.boxchars.find(x => x.char === this.npoc.ctxt)?.val;
      let cval = (uval & 0b00000100 ? 0b00000001 : 0) | (rval & 0b00001000 ? 0b00000010 : 0) | (dval & 0b00000001 ? 0b00000100 : 0) | (lval & 0b00000010 ? 0b00001000 : 0);
      this.oval = cval;
      if (!this.isclear) {
        // bit-or value by direction
        if (cval) {
          // bit-or near side at first time
          if (isfirst) {
            if (this.direction === "up") cval |= 0b00000001;
            if (this.direction === "right") cval |= 0b00000010;
            if (this.direction === "down") cval |= 0b00000100;
            if (this.direction === "left") cval |= 0b00001000;
          }
          // bit-or far side at second time
          else {
            if (this.direction === "up") cval |= 0b00000100;
            if (this.direction === "right") cval |= 0b00001000;
            if (this.direction === "down") cval |= 0b00000001;
            if (this.direction === "left") cval |= 0b00000010;
          }
        } else {
          // bit-or both side at blank area
          if (this.direction === "up") cval |= 0b00000101;
          if (this.direction === "right") cval |= 0b00001010;
          if (this.direction === "down") cval |= 0b00000101;
          if (this.direction === "left") cval |= 0b00001010;
        }
        // correct value by bit-direction
        if ([0b00000001, 0b00000010, 0b00000100, 0b00001000].includes(cval)) {
          if (this.direction === "up") cval |= 0b00000101;
          if (this.direction === "right") cval |= 0b00001010;
          if (this.direction === "down") cval |= 0b00000101;
          if (this.direction === "left") cval |= 0b00001010;
        }
      } else {
        // bit-and value by direction
        if (cval) {
          // bit-and near side at first time
          if (isfirst) {
            if (this.direction === "up") cval &= 0b11111110;
            if (this.direction === "right") cval &= 0b11111101;
            if (this.direction === "down") cval &= 0b11111011;
            if (this.direction === "left") cval &= 0b11110111;
          }
          // bit-and far side at second time
          else {
            if (this.direction === "up") cval &= 0b11111011;
            if (this.direction === "right") cval &= 0b11110111;
            if (this.direction === "down") cval &= 0b11111110;
            if (this.direction === "left") cval &= 0b11111101;
          }
        }
        // correct value by direction
        if ([0b00000001, 0b00000010, 0b00000100, 0b00001000].includes(cval)) {
          cval &= 0b00000000;
        }
      }
      // convert to text
      this.text = Boxdraw.boxchars.find(x => x.val === cval)?.char;
      this.cval = cval;
      return this.text;
    }
  }

  /** check replace or not */
  public isReplaceOrNot() {
    if (boxdraw.block) {
      if (this.isarrow) return this.cpoc.ctxt !== this.text;
      if (this.isclear) return this.cpoc.ctxt === "■" || this.cpoc.ctxt === "□";
      return this.cpoc.ctxt !== this.text;
    } else {
      if (this.isarrow) return this.cpoc.ctxt !== this.text;
      if (this.isclear) return Boxdraw.boxchars.find(x => x.char === this.cpoc.ctxt) !== null;
      return this.cpoc.ctxt !== this.text;
    }
  }
}
