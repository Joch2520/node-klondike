const readlineSync = require("readline-sync");
const fs = require("fs");
const suits = ["d","c","h","s"];
const symbols = ["◆","♣","♥","♠"];
const col = {
  bg: {
    w: "\x1b[47m",
    g: "\x1b[100m",
    e: "\x1b[0m"
  },
  txt: {
    b: "\x1b[30m",
    r: "\x1b[31m"
  }
}
const diff = {
  newbie: [1, Infinity],
  easy: [3, Infinity],
  medium: [1, 3],
  hard: [3, 3],
  master: [1, 1],
  guru: [3, 1],
  nightmare: [1, 0],
  hell: [3, 0],
  custom: null
}
const menuop = ["♣ Play", "♥ Leaderboard", "♠ Exit"]

class Card {
  constructor(suit, num) {
    this.suit = suit;
    this.symbol = "";
    this.open = false;
    this.num = num;
    switch (suit) {
      case "d":
        this.symbol = "◆"
        break;
      case "c":
        this.symbol = "♣"
        break;
      case "h":
        this.symbol = "♥"
        break;
      case "s":
        this.symbol = "♠"
        break;
      default: break;
    }
    switch (num) {
      case 1:
        this.numstr = " A"
        break;
      case 10:
        this.numstr = "10"
        break;
      case 11:
        this.numstr = " J"
        break;
      case 12:
        this.numstr = " Q"
        break;
      case 13:
        this.numstr = " K"
        break;
      default:
        this.numstr = " "+this.num;
        break;
    }
    if (suit=="d"||suit=="h") { this.color = "r", this.colorlog = col.txt.r }
    else if (suit=="c"||suit=="s") { this.color = "b", this.colorlog = col.txt.b };
  }
  flip() {
    this.open = !this.open;
    return this;
  }
}
class Deck extends Array {
  constructor() {
    super();
    for (var suit of suits) {
      for (var i = 1; i < 14; i++) {
        var currCard = new Card(suit, i);
        this.push(currCard);
      }
    }
    return this;

  }
  shuffle() {
    let len = this.length - 1;
    for (let i = len; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const tmp = this[i];
      this[i] = this[j];
      this[j] = tmp;
    }
    return this;
  }
}

function resolveBool(input) {
  if (input.toLowerCase()==("y"||"yes"||"t"||"true"||"1")) { return true }
  else if (input.toLowerCase()==("n"||"no"||"f"||"false"||"0")) { return false }
  else return undefined
}

function resolvePosNum(input, num) {
  if (!input||input==undefined||isNaN(input)) { return num }
  else return Math.abs(parseInt(input));
}


class Klondike {
  constructor(drawsize, restock) {
    this.drawsize = drawsize;
    this.restock = restock;
    this.state = 0;
    this.score = 0;
    this.prevmv = {f:[],t:[]};
    this.select = [0,0];
    this.flips = [];
    return this;
  }

  menu() {
    this.select = [0,0];
    var input=''
    while (input!=' ') {
      console.clear();
      console.log(`\n     Control keys:   E: exit      W: cursor up      S: cursor down      SPACE: select\n\n`);
      console.log(`                                Klondike Solitaire\n`)
      console.log(`                                     \x1b[31m◆ Menu\x1b[0m\n`);
      for (var i = 0; i < menuop.length; i++) {
        if (i==this.select[1]) { var clog = col.bg.g+col.txt.b } else { var clog = "" }
        if (i%2==1) { if (clog) { clog = col.bg.g+col.txt.r } else { clog = col.txt.r } }
        console.log(" ".repeat(40-(menuop[i].length/2)) + clog + menuop[i] + col.bg.e);
      }
      input = readlineSync.keyIn('',{hideEchoBack: true, mask: '', limit: 'ews '}).toLowerCase();
      switch (input) {
        case "w": if (this.select[1]) { this.select[1]-- } else { this.select[1]+=menuop.length-1 }; break;
        case "s": this.select[1]++; this.select[1]%=menuop.length; break;
        case "e": console.clear(); process.exit(0); break;
        default: break;
      }
    }
    switch (this.select[1]) {
      case 0:
        this.__askdiff();
        break;
      case 1:
        this.__getLeaderboard().__opLB();
        break;
      case 2:
        console.clear(); process.exit(0);
        break;
      default:
        break;
    }
    return this;
  }


  __askdiff() {
    this.select = [0,0];
    var input=''
    while (input!=' ') {
      console.clear();
      console.log(`\n     Control keys:   E: exit      W: cursor up      S: cursor down\n                     R: return to menu      SPACE: select\n\n`);
      console.log(`                                Select difficulty:\n`);
      for (var i = 0; i < Object.keys(diff).length; i++) {
        if (i==this.select[1]) { var clog = col.bg.g+col.txt.b;
        } else { var clog = "" }
        console.log(" ".repeat(40-(Object.keys(diff)[i].length/2)) + clog + Object.keys(diff)[i] + col.bg.e);
      }
      var sel = Object.keys(diff)[this.select[1]];
      if (sel!="custom") { var msg = `[Draws ${diff[sel][0]}, restocks ${diff[sel][1]}]`;
        console.log(`\n`+" ".repeat(40-(msg.length/2))+msg)} else { console.log(`\n`) }
      input = readlineSync.keyIn('',{hideEchoBack: true, mask: '', limit: 'ewsr '}).toLowerCase();
      switch (input) {
        case "w": if (this.select[1]) { this.select[1]-- } else { this.select[1]+=Object.keys(diff).length-1 }; break;
        case "s": this.select[1]++; this.select[1]%=Object.keys(diff).length; break;
        case "e": console.clear(); process.exit(0); break;
        case "r": return this.menu();
        default: break;
      }
    }
    if (this.select[1]<Object.keys(diff).length-1) {
      var difficulty = diff[Object.keys(diff)[this.select[1]]];
      this.drawsize = difficulty[0];
      this.restock = difficulty[1];
    } else { return this.__askcustom().play() }
    return this.play();
  }

  __askcustom() {
    this.drawsize = readlineSync.question("     Size to draw from stock?  ");
    this.drawsize = resolvePosNum(this.drawsize, 1);
    if (!this.drawsize) { this.drawsize=1 } else if (this.drawsize>12) { this.drawsize=12; }
    console.log(`     Drawsize set to ${this.drawsize}.`);
    this.restock = readlineSync.question("     Restocking count?  ");
    this.restock = resolvePosNum(this.restock, Infinity);
    console.log(`     Restock count set to ${this.restock}.`);
    var conf = "";
    while (conf!="y"&&conf!="n") { conf = readlineSync.question("     Confirm? y/n:  ").trim(); }
    if (!resolveBool(conf)) return this.__askcustom();
    return this;
  }

  __init(deck) {
    this.moves = 0;
    this.rescount = 0;
    this.score = 0;
    this.stock = [];
    this.waste = [];
    this.mainfield = [ [],[],[],[],[],[],[] ];
    this.foundation = {
      d: [],
      c: [],
      h: [],
      s: []
    };
    this.hold = [];
    this.prevmv = {f:[],t:[]};
    this.flips = [];
    this.select = [0,0];
    for (var i = 0; i < 7; i++) {
      for (var j = 0; j <= i; j++) {
        this.mainfield[i][j] = deck.pop();
      }
      this.mainfield[i][i].flip();
    }
    for (var i=0; i<deck.length; i++) {
      this.stock.push(deck.pop())
    }
    return this;
  }

  play() { return this.game().__getLeaderboard().__logLeaderboard().__setLeaderboard().__opLB(); }

  game() {
    var deck = new Deck()
    this.__init(deck.shuffle());
    this.state = 1;
    while (this.state==1) { this.__askmove() }
    if (this.state==2) {
      console.clear();
      console.log(`\n\n\n\n\n\n\n\n\n\n                       YOU WIN!\n\n\n\n\n\n\n\n\n\n`);
      readlineSync.keyIn("               Press any key to continue.\n\n\n", {hideEchoBack: true, mask:""});
    }
    return this;
  }

  newgame() {
    var prevset = resolveBool(readlineSync.question("     Use previous settings? y/n:  ").trim());
    if (prevset==undefined) { return this.newgame() }
    if (!prevset) { this.__askdiff() }
    return this.game();
  }

  __graphicize() {
    console.clear();
    console.log(`\n          Control keys:   E: exit            SPACE: select        WASD: moving cursor\n                          R: new game         F: draw cards         Z: undo last move\n`);
    console.log(`            Drawsize: ${this.drawsize}     Restock times left: ${this.restock-this.rescount}     Moves: ${this.moves}     Score: ${this.score}\n`);
    //console.log(`     Selector: ${this.select}\n\n`);


    // holdings
    var hold = []
    for (var c of this.hold) {
      if (c!=undefined) { hold.unshift(col.bg.w+c.colorlog+c.symbol+c.numstr+col.bg.e) };
    }
    process.stdout.write(`             Holding: ${hold.join(", ")}\n\n`)


    // stock and waste
    var st = "", wa = [];
    if (this.stock.length) {
      if (this.select[0]==7) { st = col.bg.g+"     "+col.bg.e  }
      else { st = col.bg.w+"     "+col.bg.e }
    } else { st="     " };
    if (this.waste.length<this.drawsize) {
      for (var c of this.waste) { wa.push(col.bg.w+c.colorlog+c.symbol+c.numstr+col.bg.e) }
    } else {
      for (var i = 0; i < this.drawsize; i++) {
        var c = this.waste[this.waste.length-this.drawsize+i];
        wa.push(col.bg.w+c.colorlog+c.symbol+c.numstr+col.bg.e);
      }
    }
    if (this.waste.length&&this.select[0]==8) { wa.push(col.bg.g+wa.pop().slice(col.bg.w.length)) }
    if (this.rescount>=this.restock&&!this.stock.length) { st="  X  "; }
    var waPH = [];
    for (var i = 0; i < this.drawsize; i++) { waPH.push("    ") }
    if (wa.length) { wa = wa.join("  ") } else { wa = waPH.join("  ") };
    process.stdout.write(`               ${st}     ${wa}          `);


    // foundations
    for (var i = 0; i<suits.length;i++) {
      if (suits[i]=="d"||suits[i]=="h") { var txtc = col.bg.w+col.txt.r }
      else if (suits[i]=="c"||suits[i]=="s") { var txtc = col.bg.w+col.txt.b };
      if (this.select[0]==i+9) { txtc = col.bg.g + txtc.slice(col.bg.w.length) };
      if (this.foundation[suits[i]].length) {
        var c = this.foundation[suits[i]][this.foundation[suits[i]].length-1].numstr;
        process.stdout.write(`${txtc}${symbols[i]}${c}${col.bg.e}     `);
      } else process.stdout.write(`${txtc}${symbols[i]}${col.bg.e}      `);
    }
    process.stdout.write(col.bg.e+"\n\n")

    //mainfield
    var maxlen = 7;
    for (var i=0; i<7; i++) { if (maxlen<this.mainfield[i].length) { maxlen = this.mainfield[i].length } }
    for (var j=0; j<maxlen; j++) {
      var k = [];
      for (var i=0; i<7; i++) {
        if (this.select[0]==i&&this.select[1]==j) { var bgc = col.bg.g }
        else { var bgc = col.bg.w }
        if (this.mainfield[i][j]!=undefined) {
          if (this.mainfield[i][j].open==undefined) {
            console.log(this.mainfield[i][j], typeof this.mainfield[i][j]); k.push("\u001b[41m    "+col.bg.e);
          } else if (this.mainfield[i][j].open){
            k.push(bgc+this.mainfield[i][j].colorlog+this.mainfield[i][j].symbol+this.mainfield[i][j].numstr+col.bg.e)
          } else {
            k.push(bgc+"    "+col.bg.e)
          }
        } else {
          k.push("    ")
        }
      }
      process.stdout.write(`               ${k.join("    ")}\n`)
    }
    process.stdout.write("\n\n")


    return this;
  }

  __askmove() {
    this.__graphicize();
    var input = readlineSync.keyIn('',{hideEchoBack: true, mask: '', limit: 'erfzwasd '}).toLowerCase();
    switch (input) {
      case "e": this.state = 0; break;
      case "r": this.state = 0; this.newgame(); break;
      case "f": this.__mv_sw(); break;
      case "z": this.__mv_undo(); break;
      case "w": if (this.select[1]) { this.select[1]-- } else { this.select[1]+=19 }; break;
      case "a": if (this.select[0]) { this.select[0]-- } else { this.select[0]+=12 }; break;
      case "s": this.select[1]++; this.select[1]%=20; break;
      case "d": this.select[0]++; this.select[0]%=13; break;
      case " ": this.__trigger(); break;
      default: break;
    }
    if (this.select[0]<7&&this.mainfield[this.select[0]].length) {
      if (this.select[1]>this.mainfield[this.select[0]].length-1)
      { this.select[1]=this.mainfield[this.select[0]].length-1; }
      while (this.mainfield[this.select[0]][this.select[1]]!=undefined
        && !this.mainfield[this.select[0]][this.select[1]].open)
      { this.select[1]++; this.select[1]%=20; }
    }
    return this.__detector();
  }

  __mv_sw() {
    if (this.hold.length) return this.__mv_back();
    if(this.stock.length) {
      this.prevmv.f.push([7, this.stock.length-1, 0])
      this.prevmv.t.push([8, this.waste.length-1])
      for (var i=0; i<this.drawsize; i++) {
        var c = this.stock.pop()
        if(!c||c==undefined) { break; };
        this.waste.push(c.flip());
        this.prevmv.f[this.prevmv.f.length-1][2]++;
      }
      this.moves++; this.flips.push([]);
    } else if (!(this.rescount>=this.restock)) {
      this.prevmv.f.push([8, this.waste.length-1])
      this.prevmv.t.push([7, 0])
      for (var j=0; j<this.waste.length;) {
        this.stock.push(this.waste.pop().flip())
      }
      this.rescount++;
      this.moves++; this.flips.push([]);
    }
    return this;
  }

  __mv_pickup(stack, amt) {
    if (!this.hold.length&&stack.length) {
      for (var i = 0; i < amt; i++) { this.hold.push(stack.pop()); }
      this.prevmv.f.push([this.select[0], this.select[1]])
    }
    return this;
  }

  __mv_place(stack) {
    if (this.hold.length&&stack!=undefined) {
      if (this.select[0]==this.prevmv.f[this.moves][0]) return this.__mv_back();
      if (this.select[0]<7) {
        if (this.hold[this.hold.length-1].num==13) {
          if (stack.length) return this.__mv_back();
        } else if (stack[stack.length-1]==undefined ||
          this.hold[this.hold.length-1].color==stack[stack.length-1].color ||
          this.hold[this.hold.length-1].num!=stack[stack.length-1].num-1) return this.__mv_back();
        this.prevmv.t.push([this.select[0], stack.length]);
        for (var i = 0; i < this.hold.length;) { stack.push(this.hold.pop()); }
        this.moves++; this.flips.push([]);
      } else if (this.hold.length==1 && this.hold[0].num==stack.length+1
        && this.select[0]==suits.indexOf(this.hold[0].suit)+9) {
        stack.push(this.hold.pop());
        this.prevmv.t.push([this.select[0], stack.length]);
        this.moves++; this.flips.push([]);
      } else return this.__mv_back();
      this.__autoflip();
    }
    return this.__calcScore();
  }

  __mv_back() {
    var pos = this.prevmv.f.pop()
    for (var i = 0; i < this.hold.length;) {
      if (pos[0]<7) { this.mainfield[pos[0]].push(this.hold.pop()); }
      else if (6<pos[0]&&pos[0]<9) { this.waste.push(this.hold.pop()); }
      else if (8<pos[0]&&pos[0]<13) { this.foundation[suits[pos[0]-9]].push(this.hold.pop()); }
    }
    return this;
  }

  __mv_undo() {
    if (!this.moves) return this;
    var target = [], len;
    var frompos = this.prevmv.f.pop()
    var topos = this.prevmv.t.pop()
    if (topos[0]<7) {
      len = this.mainfield[topos[0]].length-topos[1];
      for (var i = 0; i < len; i++) {
        target.unshift(this.mainfield[topos[0]].pop())
      }
    } else if (topos[0]==7) {
      len = this.stock.length;
      for (var i = 0; i < len; i++) {
        target.push(this.stock.pop());
      }
    } else if (topos[0]==8) {
      for (var i = 0; i < frompos[2]; i++) {
        target.unshift(this.waste.pop());
      }
    } else if (topos[0]>8) {
      target.push(this.foundation[suits[topos[0]-9]].pop());
    }
    len = target.length;
    if (frompos[0]<7) {
      for (var i = 0; i < len; i++)
      { this.mainfield[frompos[0]].push(target.shift()) }
    } else if (frompos[0]==7) {
      for (var i = 0; i < len; i++)
      { this.stock.push(target.shift()); }
      if (!this.waste.length&&this.rescount>0) { this.rescount--; }
    } else if (frompos[0]==8) {
      for (var i = 0; i < len; i++)
      { this.waste.push(target.pop()); }
    } else if (frompos[0]>8) {
      for (var i = 0; i < len; i++)
      { this.foundation[suits[frompos[0]-9]].push(target.shift()) }
    }
    for (var suit of suits) {
      if (this.foundation[suit][this.foundation[suit].length-1]==undefined)
      { this.foundation[suit].pop() }
    }
    var flips = this.flips.pop();
    for (var pos of flips) { this.mainfield[pos[0]][pos[1]].flip(); }
    this.moves--;
    this.score-=20;
    if (this.score<0) { this.score=0 }
    return this;
  }

  __trigger() {
    if (this.hold.length&&this.mainfield[this.select[0]]!=undefined) {
      return this.__mv_place(this.mainfield[this.select[0]])
    }
    if (this.select[0]<7) {
      if (this.__isMovableStack(this.mainfield[this.select[0]], this.select[1])) {
        var target = this.__getTargetStack(this.mainfield[this.select[0]], this.select[1])
        return this.__mv_pickup(this.mainfield[this.select[0]], target.length)
      }
    };
    if (this.select[0]==7) return this.__mv_sw();
    if (this.select[0]==8) return this.__mv_pickup(this.waste, 1);
    if (8<this.select[0]&&this.select[0]<13) {
      if (this.hold.length) return this.__mv_place(this.foundation[suits[this.select[0]-9]]);
      else return this.__mv_pickup(this.foundation[suits[this.select[0]-9]], 1);
    }
    return this;
  }

  __isMovableStack(stack, start) {
    var valid = true;
    var target = this.__getTargetStack(stack, start);
    for (var i = 0; i < target.length-1; i++) {
      if (target[i+1]!=undefined) {
        if (!target[i].open) { valid = false };
        if (target[i].color==target[i+1].color) { valid = false };
        if (target[i].num!=target[i+1].num+1) { valid = false };
      }
    }
    return valid;
  }

  __getTargetStack(stack, start) {
    var target = [];
    for (var i = start; i < stack.length; i++) {
      if (stack[i]!=undefined) target.push(stack[i]);
    };
    return target;
  }

  __autoflip () {
    for (var i = 0; i < 7; i++) {
      if (this.mainfield[i][this.mainfield[i].length-1]==undefined) { this.mainfield[i].pop(); }
      else if (this.mainfield[i][this.mainfield[i].length-1] instanceof Card &&
        !this.mainfield[i][this.mainfield[i].length-1].open && this.flips[this.moves-1]!=undefined) {
        this.flips[this.moves-1].push([i,this.mainfield[i].length-1]);
        this.mainfield[i][this.mainfield[i].length-1].flip();
        this.score+=5;
      }
    }
    return this;
  }

  __detector() {
    var state = true;
    for (var suit of suits) { if (this.foundation[suit].length!=13) { state = false; } }
    if (state) { this.state = 2; }
    return this;
  }

  __calcScore() {
    var mv = this.prevmv.f.length-1
    if (this.prevmv.f[mv]!=undefined&&this.prevmv.t[mv]!=undefined) {
      if (this.prevmv.f[mv][0]==8) {
        if (this.prevmv.t[mv][0]<7) { this.score+=5; }
        else if (this.prevmv.t[mv][0]>8) { this.score+=10; }
      } else if (this.prevmv.f[mv][0]>8) {
        this.score-=15;
        if (this.score<0) { this.score=0; }
      } else if (this.prevmv.f[mv][0]<7&&this.prevmv.t[mv][0]>8) { this.score+=10; }
    }
    return this;
  }

  __getLeaderboard() {
    try {
      this.lb = JSON.parse(fs.readFileSync("./leaderboard.json", "utf8"));
    } catch (e) {
      if (e.code=="ENOENT") {
        this.lb = [];
      } else throw e;
    }
    return this;
  }

  __logLeaderboard() {
    var namelen = 15;
    var scorelen = 10;
    for (var n = 0; n<this.lb.length; n++) {
      if (this.lb[n]!=undefined&&this.lb[n][0].length>namelen)
      { namelen = this.lb[n][0].length }
      if (this.lb[n]!=undefined&&`${this.lb[n][1]}`.length>scorelen)
      { scorelen = `${this.lb[n][1]}`.length }
    }
    console.clear();
    console.log(`\n\n     Leaderboard\n\n     Name`+` `.repeat(namelen-1)+`Score`+` `.repeat(scorelen-1)+`Moves`);
    for (var n = 0; n<this.lb.length && n<10; n++) {
      process.stdout.write(`     `+this.lb[n][0]);
      process.stdout.write(` `.repeat(namelen-this.lb[n][0].length+3)+this.lb[n][1]);
      console.log(` `.repeat(scorelen-`${this.lb[n][1]}`.length+4)+this.lb[n][2]);
    }
    return this;
  }

  __opLB() {
    this.__getLeaderboard().__logLeaderboard();
    console.log(`\n\n     Press R to go to main menu\n     Press E to exit`);
    var input = readlineSync.keyIn('',{hideEchoBack: true, mask: '', limit: 'er'}).toLowerCase();
    switch (input) {
      case "r": this.menu(); break;
      case "e": console.clear(); process.exit(0); break;
      default: break;
    }
    return this;
  }

  __setLeaderboard() {
    var name = readlineSync.question("\n\n     Please enter name: ");
    var i = 0, j = this.lb.length-1, k = Math.floor((i+j)/2);
    while (this.lb[k]!=undefined&&this.lb[k][1]!=this.score) {
      if (this.lb[k][1]>this.score) { i = k+1; } else { j = k-1; }
      k = Math.floor((i+j)/2);
      if (j<=i) break;
    }
    i=k;j=k;
    while (this.lb[i-1]!=undefined&&this.lb[i-1][1]==this.score) { i--; }
    while (this.lb[j+1]!=undefined&&this.lb[j+1][1]==this.score) { j++; }
    if (i!=j) {
      k = Math.ceil((i+j)/2);
      while (this.lb[k]!=undefined&&this.lb[k][2]!=this.moves) {
        if (this.lb[k][2]<this.moves) { i = k+1; } else { j = k-1; }
        k = Math.ceil((i+j)/2);
        if (j<=i) break;
      }
    }
    while (this.lb[k]!=undefined&&this.lb[k][1]>this.score) { k++; }
    while (this.lb[k]!=undefined&&this.lb[k][1]==this.score&&this.lb[k][2]<=this.moves) { k++; }
    if (!this.lb.length||k>this.lb.length-1) { k=this.lb.length; } else if (k<0) { k=0; }
    this.lb.splice(k, 0, [name, this.score, this.moves]);
    fs.writeFileSync("./leaderboard.json", JSON.stringify(this.lb, null, 2), "utf8");
    return this;
  }
}

var game = new Klondike();
game.menu();
