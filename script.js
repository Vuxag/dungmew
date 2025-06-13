/*
 * Settings
 */
var settings = {
    particles: {
        length: 500, // maximum amount of particles
        duration: 2, // particle duration in sec
        velocity: 100, // particle velocity in pixels/sec
        effect: -0.75, // play with this for a nice effect
        size: 30, // particle size in pixels
    },
};

/*
 * RequestAnimationFrame polyfill by Erik Möller
 */
(function () {
    var b = 0;
    var c = ["ms", "moz", "webkit", "o"];
    for (var a = 0; a < c.length && !window.requestAnimationFrame; ++a) {
        window.requestAnimationFrame = window[c[a] + "RequestAnimationFrame"];
        window.cancelAnimationFrame = window[c[a] + "CancelAnimationFrame"] || window[c[a] + "CancelRequestAnimationFrame"];
    }
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (h, e) {
            var d = new Date().getTime();
            var f = Math.max(0, 16 - (d - b));
            var g = window.setTimeout(function () {
                h(d + f);
            }, f);
            b = d + f;
            return g;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (d) {
            clearTimeout(d);
        };
    }
})();

/*
 * Point class
 */
var Point = (function () {
    function Point(x, y) {
        this.x = typeof x !== "undefined" ? x : 0;
        this.y = typeof y !== "undefined" ? y : 0;
    }
    Point.prototype.clone = function () {
        return new Point(this.x, this.y);
    };
    Point.prototype.length = function (length) {
        if (typeof length == "undefined") return Math.sqrt(this.x * this.x + this.y * this.y);
        this.normalize();
        this.x *= length;
        this.y *= length;
        return this;
    };
    Point.prototype.normalize = function () {
        var length = this.length();
        this.x /= length;
        this.y /= length;
        return this;
    };
    return Point;
})();

/*
 * Particle class
 */
var Particle = (function () {
    function Particle() {
        this.position = new Point();
        this.velocity = new Point();
        this.acceleration = new Point();
        this.age = 0;
    }
    Particle.prototype.initialize = function (x, y, dx, dy) {
        this.position.x = x;
        this.position.y = y;
        this.velocity.x = dx;
        this.velocity.y = dy;
        this.acceleration.x = dx * settings.particles.effect;
        this.acceleration.y = dy * settings.particles.effect;
        this.age = 0;
    };
    Particle.prototype.update = function (deltaTime) {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        this.age += deltaTime;
    };
    Particle.prototype.draw = function (context, image) {
        function ease(t) {
            return --t * t * t + 1;
        }
        var size = image.width * ease(this.age / settings.particles.duration);
        context.globalAlpha = 1 - this.age / settings.particles.duration;
        context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
    };
    return Particle;
})();

/*
 * ParticlePool class
 */
var ParticlePool = (function () {
    var particles,
        firstActive = 0,
        firstFree = 0,
        duration = settings.particles.duration;

    function ParticlePool(length) {
        // create and populate particle pool
        particles = new Array(length);
        for (var i = 0; i < particles.length; i++) particles[i] = new Particle();
    }
    ParticlePool.prototype.add = function (x, y, dx, dy) {
        particles[firstFree].initialize(x, y, dx, dy);

        // handle circular queue
        firstFree++;
        if (firstFree == particles.length) firstFree = 0;
        if (firstActive == firstFree) firstActive++;
        if (firstActive == particles.length) firstActive = 0;
    };
    ParticlePool.prototype.update = function (deltaTime) {
        var i;

        // update active particles
        if (firstActive < firstFree) {
            for (i = firstActive; i < firstFree; i++) particles[i].update(deltaTime);
        } else if (firstFree < firstActive) {
            for (i = firstActive; i < particles.length; i++) particles[i].update(deltaTime);
            for (i = 0; i < firstFree; i++) particles[i].update(deltaTime);
        }

        // remove inactive particles
        while (particles[firstActive].age >= duration && firstActive != firstFree) {
            firstActive++;
            if (firstActive == particles.length) firstActive = 0;
        }
    };
    ParticlePool.prototype.draw = function (context, image) {
        // draw active particles
        if (firstActive < firstFree) {
            for (i = firstActive; i < firstFree; i++) particles[i].draw(context, image);
        } else if (firstFree < firstActive) {
            for (i = firstActive; i < particles.length; i++) particles[i].draw(context, image);
            for (i = 0; i < firstFree; i++) particles[i].draw(context, image);
        }
    };
    return ParticlePool;
})();

/*
 * Heart class
 */
var Heart = (function () {
    var image = new Image();
    image.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTEwLTI4VDEyOjQ5OjE3KzA3OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOS0xMC0yOFQxMzowMTozMCswNzowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOS0xMC0yOFQxMzowMTozMCswNzowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowZWRiNWM1OS1hZjM0LTRhNDctODFhZC1mYzM5YzM5YzM5YzMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MGVkYjVjNTktYWYzNC00YTQ3LTgxYWQtZmMzOWMzOWMzOWMzIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MGVkYjVjNTktYWYzNC00YTQ3LTgxYWQtZmMzOWMzOWMzOWMzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowZWRiNWM1OS1hZjM0LTRhNDctODFhZC1mYzM5YzM5YzM5YzMiIHN0RXZ0OndoZW49IjIwMTktMTAtMjhUMTI6NDk6MTcrMDc6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAAAh+QQJCgAAACwAAAAAAwADAAACBZQjmIAFADs=";

    function Heart() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.resize();
    }
    Heart.prototype.resize = function () {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    };
    Heart.prototype.draw = function (point, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);
        this.ctx.lineTo(point.x + 10, point.y + 10);
        this.ctx.lineTo(point.x + 20, point.y);
        this.ctx.lineTo(point.x + 30, point.y + 10);
        this.ctx.lineTo(point.x + 40, point.y);
        this.ctx.lineTo(point.x + 50, point.y + 10);
        this.ctx.lineTo(point.x + 60, point.y);
        this.ctx.lineTo(point.x + 70, point.y + 10);
        this.ctx.lineTo(point.x + 80, point.y);
        this.ctx.lineTo(point.x + 90, point.y + 10);
        this.ctx.lineTo(point.x + 100, point.y);
        this.ctx.lineTo(point.x + 100, point.y + 20);
        this.ctx.lineTo(point.x + 90, point.y + 30);
        this.ctx.lineTo(point.x + 80, point.y + 20);
        this.ctx.lineTo(point.x + 70, point.y + 30);
        this.ctx.lineTo(point.x + 60, point.y + 20);
        this.ctx.lineTo(point.x + 50, point.y + 30);
        this.ctx.lineTo(point.x + 40, point.y + 20);
        this.ctx.lineTo(point.x + 30, point.y + 30);
        this.ctx.lineTo(point.x + 20, point.y + 20);
        this.ctx.lineTo(point.x + 10, point.y + 30);
        this.ctx.lineTo(point.x, point.y + 20);
        this.ctx.closePath();
        this.ctx.fill();
    };
    return Heart;
})();

/*
 * Animation loop
 */
(function (canvas) {
    var ctx = canvas.getContext("2d"),
        particles = new ParticlePool(settings.particles.length),
        particleRate = settings.particles.length / settings.particles.duration, // particles/sec
        time;

    // get point on heart with -PI <= t <= PI
    function pointOnHeart(t) {
        return new Point(
            160 * Math.pow(Math.sin(t), 3),
            130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
        );
    }

    // creating the particle image using a dummy canvas
    var image = (function () {
        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d");
        canvas.width = settings.particles.size;
        canvas.height = settings.particles.size;
        // helper function to create the path
        function to(t) {
            var point = pointOnHeart(t);
            point.x = settings.particles.size / 2 + (point.x * settings.particles.size) / 350;
            point.y = settings.particles.size / 2 - (point.y * settings.particles.size) / 350;
            return point;
        }
        // create the path
        ctx.beginPath();
        var t = -Math.PI;
        var point = to(t);
        ctx.moveTo(point.x, point.y);
        while (t < Math.PI) {
            t += 0.01; // baby steps!
            point = to(t);
            ctx.lineTo(point.x, point.y);
        }
        ctx.closePath();
        // create the fill
        ctx.fillStyle = "#ea80b0";
        ctx.fill();
        // create the image
        var image = new Image();
        image.src = canvas.toDataURL();
        return image;
    })();

    // render that thing!
    function render() {
        // next animation frame
        requestAnimationFrame(render);

        // update time
        var newTime = new Date().getTime() / 1000,
            deltaTime = newTime - (time || newTime);
        time = newTime;

        // clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // create new particles
        var amount = particleRate * deltaTime;
        for (var i = 0; i < amount; i++) {
            var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
            var dir = pos.clone().length(settings.particles.velocity);
            particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
        }

        // update and draw particles
        particles.update(deltaTime);
        particles.draw(ctx, image);
    }

    // handle visibility by focusing on blur/focus
    var blurHandler = function () {
        function focus() {
            time = new Date().getTime() / 1000;
            render();
        }
        function blur() {
            render();
        }
        // focus, blur
        window.addEventListener("focus", focus, false);
        window.addEventListener("blur", blur, false);
        focus();
    };

    // handle orientation changes
    var resizeHandler = function () {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resizeHandler, false);
    resizeHandler();

    // start animation when the images are loaded
    window.addEventListener("load", function () {
        resizeHandler();
        blurHandler();
    });
})(document.getElementById("pinkboard")); 