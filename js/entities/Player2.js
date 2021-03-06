game.PlayerTwoEntity = me.Entity.extend ({
    init: function(x, y, settings){
        this.setSuper(x, y);
        this.setPlayerTimers();
        this.setAttributes();
        this.setFlags();
        
        this.type = "Player2";
        
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
        
        this.addAnimation();

        this.renderable.setCurrentAnimation("idle");
    
    },
    
    setSuper: function(x, y) {
        this._super(me.Entity, "init", [x, y, {
            image: "link",
            width: 72,
            height: 72,
            spritewidth: "72",
            spriteheight: "72",
            getShape: function () {
                return(new me.Rect(0, 0, 42, 52)).toPolygon();
            }
        }]);
    
        //Binds the movement keys.
        me.input.bindKey(me.input.KEY.RIGHT, "right2");
        me.input.bindKey(me.input.KEY.LEFT, "left2");
        me.input.bindKey(me.input.KEY.UP, "jump2");
        me.input.bindKey(me.input.KEY.I, "regularAttack2");
        me.input.bindKey(me.input.KEY.O, "specialAttack2");
        me.input.bindKey(me.input.KEY.P, "block2");
    },
    
    setPlayerTimers: function() {
        this.now = new Date().getTime();
        this.lastHit = this.now;
        this.lastSpear = this.now;
        this.lastAttack = new Date().getTime();
    },
    
    setAttributes: function() {
        this.health = game.data.playerHealth;
        this.attack = game.data.playerAttack;
        this.body.setVelocity(game.data.playerMoveSpeed, 20);
    },
    
    setFlags: function() {
        this.facing = "right"; //Keeps track on where your character is going.
        this.dead = false;
        this.attacking = false;
    },
    
    addAnimation: function() {
        this.renderable.addAnimation("idle", [0]);
        this.renderable.addAnimation("walk", [1,2,3,4,5,6], 80);
        this.renderable.addAnimation("attack", [7,8,9,10,11,12], 80);
    },
    
    update: function(delta){
        this.now = new Date().getTime();
        
        this.dead = this.checkIfDead();
        this.checkKeyPressesAndMovement();
        this.checkAbilityKeys();
        this.setAnimation();
        
        me.collision.check(this, true, this.collideHandler.bind(this), true);        
        this.body.update(delta);
        
        this._super(me.Entity, "update", [delta]);
        return true;        
    },
    
    checkIfDead: function() {
        if(this.health <= 0) {
            return true;
        }
        return false;
    },
    
    checkKeyPressesAndMovement: function() {
        if(me.input.isKeyPressed("right2")) {
            this.moveRight();
        }
        else if(me.input.isKeyPressed("left2")) {            
            this.moveLeft();
        }
        else {
            this.body.vel.x = 0;
        }
        
        if(me.input.isKeyPressed("jump2") && !this.body.jumping && !this.body.falling) {
            this.jump();
        }
        
        this.attacking = me.input.isKeyPressed("regularAttack2");
    },
    
    moveRight: function() {
        //Sets the position of x by adding the velocity (made in setVelocity)
        //and multiplies it by me.timer.tick. me.timer.tick makes the movement
        //nice and smooth.
        this.body.vel.x += this.body.accel.x * me.timer.tick;
        this.facing = "right";
        this.flipX(false);
    },
    
    moveLeft: function() {
        this.body.vel.x -= this.body.accel.x * me.timer.tick;
        this.facing = "left";
        this.flipX(true);
    },
    
    jump: function() {
        this.body.vel.y -= this.body.accel.y * me.timer.tick;
        this.body.jumping = true;
    },
    
    checkAbilityKeys: function() {
        if(me.input.isKeyPressed("ability1")) {
            //this.speedBurst();
        }
        else if(me.input.isKeyPressed("ability2")) {
            //this.eatCreep();
        }
        else if(me.input.isKeyPressed("ability3")) {
            console.log("SPEAR");
            this.throwSpear();
        }
    },
    
    throwSpear: function() {
        if(this.now - this.lastSpear >= game.data.spearTimer && game.data.ability3 > 0) {
            this.lastSpear = this.now;
            var spear = me.pool.pull("spear", this.pos.x, this.pos.y, {}, this.facing);
            me.game.world.addChild(spear, 10);
        }
    },
    
    setAnimation: function() {
        if(this.attacking) {
            if(!this.renderable.isCurrentAnimation("attack")) {
                //Sets animation to attack and when done goes to idle.
                this.renderable.setCurrentAnimation("attack", "idle");
                //Makes it so that we start off on frame one every time we start.
                this.renderable.setAnimationFrame();
            }
        }        
        else if(this.body.vel.x !== 0 && !this.renderable.isCurrentAnimation("attack")) {
            if(!this.renderable.isCurrentAnimation("walk")) {
                this.renderable.setCurrentAnimation("walk");
            }
        }
        else if(!this.renderable.isCurrentAnimation("attack")) {
            this.renderable.setCurrentAnimation("idle");
        }
    },
    
    loseHealth: function(damage) {
        this.health = this.health - damage;
        console.log("Link",this.health);
    },
    
    collideHandler: function(response) {
        this.now = new Date().getTime();
        if(response.b.type === "Player1") {
            this.collideWithEnemyTeam(response);            
        }           
    },
    
    collideWithEnemyTeam: function(response) {
            var xdif = this.pos.x - response.b.pos.x;
            var ydif = this.pos.y - response.b.pos.y;
                
            this.stopMovement(xdif);
                
            if(this.checkAttack(xdif, ydif)) {
                this.hitCreep(response);
            }
    },
    
    stopMovement: function(xdif) {
        if(xdif > 0) {
            if(this.facing === "left") {
            this.body.vel.x = 0;
            }
        }
        else {
            if(this.facing === "right") {
            this.body.vel.x = 0;
            }
        }
    },
    
    checkAttack: function(xdif, ydif) {
        if((this.renderable.isCurrentAnimation("attack") && this.now - this.lastHit >= game.data.playerAttackTimer)
                && (Math.abs(ydif) <= 40) 
                && (((xdif > 0) && this.facing === "left") || ((xdif < 0) && this.facing === "right"))
                ) {
                    this.lastHit = this.now;
                    return true;
            }
        return false;
    },
    
    hitCreep: function(response) {
        //If the creeps code is less than our attack, gain gold for a creep kill.
        if(response.b.health <= game.data.playerAttack) {
            game.data.gold += 1;
            console.log("Current Gold: " + game.data.gold);
        }
        response.b.loseHealth(game.data.playerAttack);
    }
});