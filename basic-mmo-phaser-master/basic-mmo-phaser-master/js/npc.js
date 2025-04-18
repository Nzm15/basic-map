var NPC = {
    sprite: null,
    talking: false,
    dialogueText: null,
    interactKey: null,
    currentPoint: 0,
    speed: 1,
    points: [
        {x: 194, y: 248},
        {x: 630, y: 461}, 
        {x: 91, y: 471}
    ],
    messages: ['Hello!', 'Good morning!', 'Have a nice day!'],
    isWaiting: false,
    waitTime: 2000, //
    waitTimer: null,
    currentTween: null,
    moveSpeed: 3000 // Time in ms to move between points
};

NPC.create = function(game, x, y) {
    this.sprite = game.add.sprite(x, y, 'npc1');
    this.sprite.inputEnabled = true;
    this.sprite.events.onInputDown.add(this.interact, this);
    
    // Add interaction key
    this.interactKey = game.input.keyboard.addKey(Phaser.Keyboard.E);
    
    // Create dialogue text
    this.dialogueText = game.add.text(0, 0, '', {
        font: '16px Arial',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    });
    this.dialogueText.visible = false;
    
    // Set up animations
    game.anims.create({
        key: 'npc-idle',
        frames: game.anims.generateFrameNumbers('npc1', { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1
    });

    game.anims.create({
        key: 'npc-walk',
        frames: game.anims.generateFrameNumbers('npc1', { start: 6, end: 11 }),
        frameRate: 10,
        repeat: -1
    });
    
    this.sprite.play('npc-idle');
};

NPC.interact = function() {
    if (!this.talking) {
        this.talking = true;
        this.sprite.play('npc-idle');
        
        var currentMessage = 0;
        this.dialogueText.visible = true;
        this.dialogueText.x = this.sprite.x - 50;
        this.dialogueText.y = this.sprite.y - 50;
        
        var showNextMessage = function() {
            if (currentMessage < this.messages.length) {
                this.dialogueText.text = this.messages[currentMessage];
                currentMessage++;
                game.time.events.add(2000, showNextMessage, this);
            } else {
                this.dialogueText.visible = false;
                this.talking = false;
                game.time.events.add(1000, function() {
                    this.sprite.play('npc-walk');
                }, this);
            }
        }.bind(this);
        
        showNextMessage();
    }
};

NPC.update = function(game, player) {
    if (!this.sprite) return;
    
    if (!this.talking && !this.isWaiting && !this.currentTween) {
        var targetPoint = this.points[this.currentPoint];
        
        // Calculate distance for duration
        var distance = Phaser.Math.distance(
            this.sprite.x, 
            this.sprite.y, 
            targetPoint.x, 
            targetPoint.y
        );
        
        // Create smooth movement tween
        this.currentTween = game.add.tween(this.sprite).to({
            x: targetPoint.x,
            y: targetPoint.y
        }, this.moveSpeed, Phaser.Easing.Linear.None, true);
        
        // Face the correct direction
        this.sprite.scale.x = (targetPoint.x > this.sprite.x) ? 1 : -1;
        this.sprite.play('npc-walk', true);
        
        // When movement completes
        this.currentTween.onComplete.add(function() {
            this.currentTween = null;
            this.sprite.play('npc-idle');
            this.isWaiting = true;
            
            // Wait at point
            game.time.events.add(this.waitTime, function() {
                this.isWaiting = false;
                this.currentPoint = (this.currentPoint + 1) % this.points.length;
            }, this);
        }, this);
    }
    
    // Handle player proximity
    if (player) {
        var distanceToPlayer = Phaser.Math.distance(
            player.x, 
            player.y, 
            this.sprite.x, 
            this.sprite.y
        );
        
        if (distanceToPlayer < 100 && !this.talking) {
            if (!this.dialogueText.visible) {
                this.dialogueText.text = 'Press E to talk';
                this.dialogueText.visible = true;
                this.dialogueText.x = this.sprite.x - 50;
                this.dialogueText.y = this.sprite.y - 50;
            }
            if (this.interactKey.isDown) {
                if (this.currentTween) {
                    this.currentTween.stop();
                    this.currentTween = null;
                }
                this.interact();
            }
        } else if (!this.talking) {
            this.dialogueText.visible = false;
        }
    }
};