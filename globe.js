var scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.0001, 100);
camera.position.z = 2.5;
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth - window.innerWidth / 150, window.innerHeight - window.innerHeight / 100);
renderer.sortObjects = true;
renderer.renderOrder = 1;
document.body.appendChild(renderer.domElement);
var controls;
controls = new THREE.OrbitControls(camera);
controls.minDistance = 1.001;
controls.maxDistance = 3;
controls.noPan = true;
var frustum = new THREE.Frustum();
var cameraViewProjectionMatrix = new THREE.Matrix4();
var zoom = 4;
var horizontal = vertical = Math.pow(2, zoom);
var xy_count = Math.max(32 / Math.pow(2, zoom), 1);
THREE.ImageUtils.crossOrigin = '';
var tiles = [];
var tiles_number = 0;
var D;

window.onload = function init() {
    this.addEventListener('mousedown', onMouseDown, false);
    D = getCoordinatesOfTiles();
    drawEarth();
     DrawRectangle(new THREE.Vector2(53,	-9), new THREE.Vector2(65,-30));
    //    DrawRectangle(new THREE.Vector2(5,5),new THREE.Vector2(-40,-40));
    // drawRoad(new THREE.Vector2(53, -9), new THREE.Vector2(65, -30));
    render();
};

window.onresize = function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - window.innerWidth / 150, window.innerHeight - window.innerHeight / 100);
};

function onMouseDown() {
    this.addEventListener('mousemove', onMouseMove, false);
    this.addEventListener('mouseup', onMouseUp, false);
}

function onMouseMove(event) {
    drawEarth();
}

function onMouseUp(event) {
    this.removeEventListener('mousemove', onMouseMove, false);
    this.removeEventListener('mouseup', onMouseUp, false);
}

function clearScene(scene) {
    for (var i = scene.children.length - 1; i >= 0; i--) {
        obj = scene.children[i];
        scene.remove(obj);
    }
}

function in_array(value, array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].equals(value)) return true;
    }
    return false;
}

/**
 * проверка, попадает ли геометрия в камеру
 * @param geometry
 * @returns {boolean|*}
 */
function checkIt(geometry) {
    //check if we should draw it===============================//
    camera.updateMatrixWorld(); // make sure the camera matrix is updated
    camera.matrixWorldInverse.getInverse(camera.matrixWorld);
    cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromMatrix(cameraViewProjectionMatrix);
    edges = geometry.faces[0].normal;
    return (edges.angleTo(camera.position) < Math.PI / 2 && frustum.intersectsObject(squareMesh));
}

/**
 *  протстой перевод из hsl в rgb
 * @param h
 * @param s
 * @param l
 * @returns {THREE.Vector3}
 */
function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }
        h = h / 360;
        var q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        var p = 2.0 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return new THREE.Vector3(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

//значение в hsl
function valueToHSL(value) {
    var h = (1.0 - value) * 240
    return h;
}

// массив в хитмап
function ToColor(data, opacity) {
// ,color1,color2) {
//     if(typeof (data)!="array" || typeof (color1)!="THREE.Vector3" || typeof (color2)!="THREE.Vector3"){
//         return -1;
//     }
    opacity = typeof opacity !== 'undefined' ? opacity : 0.5;
    Xmin = data[0];
    Xmax = data[0];
    var color = new Uint8Array(4 * data.length);
    for (i = 1; i < data.length; i++) {
        if (Xmin > data[i]) {
            Xmin = data[i];
        }
        if (Xmax < data[i]) {
            Xmax = data[i];
        }
    }
    for (i = 0; i < data.length; i++) {
        data[i] -= Xmin;
    }
    ratio = Xmax / 1;

    for (i = 0; i < data.length; i++) {
        temp_color = valueToHSL(data[i] / ratio);
        temp_color = hslToRgb(temp_color, 1, 0.50);
        color[4 * i] = temp_color.x;
        color[4 * i + 1] = temp_color.y;
        color[4 * i + 2] = temp_color.z;
        color[4 * i + 3] = opacity * 255;
    }
    return color;
    //ToDo: create some formula for color. it depends on color1,color2 and data, find min and max .
    // color1_value=min(data);
    // color2_value=max(data);
    // var dummyRGBA = new Uint8Array(dataX * dataY * 4);
    // for (var i = 0; i < dataX * dataY; i++) {
    //     // RGB from 0 to 255
    //     dummyRGBA[4 * i] = color1.x*data[i][j];
    //     dummyRGBA[4 * i + 1] = dummyRGBA[4 * i + 2] = 255 * i / (dataX * dataY);
    //     // OPACITY
    //     dummyRGBA[4 * i + 3] = opacity;
    // }

}

function drawRoad(point1, point2) {
    var material = new THREE.LineBasicMaterial({
        color: 0x0000ff
    });
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3(GetCoordinates(point1.x, point1.y, 1)),
        new THREE.Vector3(GetCoordinates(point2.x, point2.y, 1))
    );
    console.log(geometry);
    var line = new THREE.Line(geometry, material);
    scene.add(line);
}
function CoordinatesFromMercator(x, y) {
    var lon = (x / horizontal) * 360 - 180;
    var n = (Math.PI - ((2 * Math.PI * y)) / vertical);
    //var lat=Math.atan(Math.sin(Math.PI-(y/vertical)*2*Math.PI))*(180/Math.PI);
    var lat = 180 / Math.PI * Math.atan(Math.sinh(n));
    return (new THREE.Vector2(lat, lon));
}

function GetCoordinates(lat, lon, R) {
    lat = lat * Math.PI / 180;
    lon = lon * Math.PI / 180;
    var x = R * Math.cos(lat) * Math.cos(lon);
    var z = R * Math.cos(lat) * Math.sin(lon);
    var y = R * Math.sin(lat);
    return (new THREE.Vector3(x, y, z));
}
//points are Vector2, longtitude and lattitude of edges of rectangle we drawing
//point.x - lattitude,point.y - longtitude
function DrawRectangle(point1, point2) {
    //get up left and bottom right
    var x1 = Math.max(point1.x, point2.x);
    var y1 = Math.max(point1.y, point2.y);
    var x2 = Math.min(point1.x, point2.x);
    var y2 = Math.min(point1.y, point2.y);
    var ul = new THREE.Vector2(x1, y1);
    var br = new THREE.Vector2(x2, y2);
    var hor_number_of_vertices = 2;
    var ver_number_of_vertices = 2;
    var squareGeometry = new THREE.Geometry();
    var flag = false;
    squareGeometry.vertices.push(GetCoordinates(x1, y1, 1));
    //filling first row (thin rects)
    //  console.log(D);
    console.log(br, ul);
    for (i = 0; i < vertical * xy_count; i++) {
        for (j = horizontal * xy_count - 1; j >= 0; j--) {
            if (D[i][j].x <= ul.x && D[i][j].y <= ul.y && D[i][j].x >= br.x && D[i][j].y >= br.y) {
                flag = true;
                squareGeometry.vertices.push(GetCoordinates(ul.x, D[i][j].y, 1));
                // console.log(D[i][j].x, D[i][j].y);
                hor_number_of_vertices++;
            }
        }
        if (flag) break;
    }
    squareGeometry.vertices.push(GetCoordinates(x1, y2, 1));
    //first row completed
    //center;
    var x0, y0, x3, y3;
    for (var i = 0; i < vertical * xy_count; i++) {
        if (D[i][0].x < ul.x && D[i][0].x > br.x) {
            ver_number_of_vertices++;
            squareGeometry.vertices.push(GetCoordinates(D[i][0].x, ul.y, 1));
            for (var j = horizontal * xy_count - 1; j >= 0; j--)
                if (D[i][j].y <= ul.y && D[i][j].y >= br.y) {
                    if (x0 == undefined) x0 = D[i][j].x;
                    if (y0 == undefined) y0 = D[i][j].y;
                    x3 = D[i][j].x;
                    y3 = D[i][j].y;
                    console.log(D[i][j].x, D[i][j].y);
                    squareGeometry.vertices.push(GetCoordinates(D[i][j].x, D[i][j].y, 1));
                }
            squareGeometry.vertices.push(GetCoordinates(D[i][0].x, br.y, 1));
        }
    }
    //center completed
    //last row
    flag = false;
    squareGeometry.vertices.push(GetCoordinates(x2, y1, 1));
    for (var i = vertical * xy_count - 1; i >= 0; i--) {
        for (var j = horizontal * xy_count - 1; j >= 0; j--) {
            //         console.log(D[i][j], br, ul);

            if (D[i][j].x <= ul.x && D[i][j].y <= ul.y && D[i][j].x >= br.x && D[i][j].y >= br.y) {
                flag = true;
                squareGeometry.vertices.push(GetCoordinates(br.x, D[i][j].y, 1));
            }
        }
        if (flag) break;
    }
    squareGeometry.vertices.push(GetCoordinates(x2, y2, 1));
    //vertices completed

    // faces
    for (var i = 0; i < ver_number_of_vertices - 1; i++)
        for (var j = 0; j < hor_number_of_vertices - 1; j++) {
            squareGeometry.faces.push(new THREE.Face3(i * hor_number_of_vertices + j + 1, i * hor_number_of_vertices + j, (i + 1) * hor_number_of_vertices + j));
            squareGeometry.faces.push(new THREE.Face3(i * hor_number_of_vertices + j + 1, (i + 1) * hor_number_of_vertices + j, (i + 1) * hor_number_of_vertices + j + 1));
        }
    console.log(hor_number_of_vertices, ver_number_of_vertices);

    //UVs
    var width = Math.abs(x2 - x1);
    var height = Math.abs(y2 - y1);
    var a = Math.abs(x0 - x1) / width;
    var aaa = Math.abs(x2 - x3) / width;
    var aa = Math.abs((1 - a - aaa) / (hor_number_of_vertices - 3));
    var b = Math.abs(y0 - y1) / height;
    var bbb = Math.abs(y2 - y3) / height;
    var bb = Math.abs((1 - b - bbb) / (ver_number_of_vertices - 3));
    var a_counter = a;
    var b_counter = b;

    squareGeometry.faceVertexUvs[0].push([
        new THREE.Vector2(0, a),
        new THREE.Vector2(0, 0),
        new THREE.Vector2(b, 0)]);
    squareGeometry.faceVertexUvs[0].push([
        new THREE.Vector2(0, a),
        new THREE.Vector2(b, 0),
        new THREE.Vector2(b, a)]);
    for (i = 0; i < hor_number_of_vertices - 3; i++) {
        squareGeometry.faceVertexUvs[0].push([
            new THREE.Vector2(0, a_counter + aa),
            new THREE.Vector2(0, a_counter),
            new THREE.Vector2(b, a_counter)]);
        squareGeometry.faceVertexUvs[0].push([
            new THREE.Vector2(0, a_counter + aa),
            new THREE.Vector2(b, a_counter),
            new THREE.Vector2(b, a_counter + aa)]);
        a_counter = a_counter + aa;
    }
    squareGeometry.faceVertexUvs[0].push([
        new THREE.Vector2(0, 1),
        new THREE.Vector2(0, a_counter),
        new THREE.Vector2(b, a_counter)]);
    squareGeometry.faceVertexUvs[0].push([
        new THREE.Vector2(0, 1),
        new THREE.Vector2(b, a_counter),
        new THREE.Vector2(b, 1)]);
    a_counter = a;
    b_counter = b;
    for (i = 0; i < ver_number_of_vertices - 3; i++) {
        squareGeometry.faceVertexUvs[0].push([
            new THREE.Vector2(b_counter, a),
            new THREE.Vector2(b_counter, 0),
            new THREE.Vector2(b_counter + bb, 0)
        ]);
        squareGeometry.faceVertexUvs[0].push([
            new THREE.Vector2(b_counter, a),
            new THREE.Vector2(b_counter + bb, 0),
            new THREE.Vector2(b_counter + bb, a)
        ]);
        for (j = hor_number_of_vertices - 3; j > 0; j--) {
            squareGeometry.faceVertexUvs[0].push([
                new THREE.Vector2(b_counter, a_counter + aa),
                new THREE.Vector2(b_counter, a_counter),
                new THREE.Vector2(b_counter + bb, a_counter)
            ]);
            squareGeometry.faceVertexUvs[0].push([
                new THREE.Vector2(b_counter, a_counter + aa),
                new THREE.Vector2(b_counter + bb, a_counter),
                new THREE.Vector2(b_counter + bb, a_counter + aa)
            ]);
            a_counter = a_counter + aa;
        }
        squareGeometry.faceVertexUvs[0].push([
            new THREE.Vector2(b_counter, a_counter + aaa),
            new THREE.Vector2(b_counter, a_counter),
            new THREE.Vector2(b_counter + bb, a_counter)
        ]);
        squareGeometry.faceVertexUvs[0].push([
            new THREE.Vector2(b_counter, a_counter + aaa),
            new THREE.Vector2(b_counter + bb, a_counter),
            new THREE.Vector2(b_counter + bb, a_counter + aaa)
        ]);
        b_counter = b_counter + bb;
        a_counter = a;
    }
    squareGeometry.faceVertexUvs[0].push([
        new THREE.Vector2(b_counter, a),
        new THREE.Vector2(b_counter, 0),
        new THREE.Vector2(b_counter + bbb, 0)
    ]);
    squareGeometry.faceVertexUvs[0].push([
        new THREE.Vector2(b_counter, a),
        new THREE.Vector2(b_counter + bbb, 0),
        new THREE.Vector2(b_counter + bbb, a)
    ]);
    a_counter = a;
    for (i = 0; i < hor_number_of_vertices - 3; i++) {
        squareGeometry.faceVertexUvs[0].push([
            new THREE.Vector2(b_counter, a_counter + aa),
            new THREE.Vector2(b_counter, a_counter),
            new THREE.Vector2(b_counter + bbb, a_counter)
        ]);
        squareGeometry.faceVertexUvs[0].push([
            new THREE.Vector2(b_counter, a_counter + aa),
            new THREE.Vector2(b_counter + bbb, a_counter),
            new THREE.Vector2(b_counter + bbb, a_counter + aa)
        ]);
        a_counter = a_counter + aa;
    }
    squareGeometry.faceVertexUvs[0].push([
        new THREE.Vector2(b_counter, a_counter + aaa),
        new THREE.Vector2(b_counter, a_counter),
        new THREE.Vector2(b_counter + bbb, a_counter)
    ]);
    squareGeometry.faceVertexUvs[0].push([
        new THREE.Vector2(b_counter, a_counter + aaa),
        new THREE.Vector2(b_counter + bbb, a_counter),
        new THREE.Vector2(b_counter + bbb, a_counter + aaa)
    ]);
    //  squareGeometry.computeFaceNormals();
    //todo: change this to function
    var dataX = 160;
    var dataY = 160;
    var dummyRGBA = new Uint8Array(dataX * dataY * 4);
    var dummy = new Array(dataX * dataY);
    // for (var i = 0; i < dataX * dataY; i++) {
    //     // RGB from 0 to 255
    //     dummyRGBA[4 * i] = dummyRGBA[4 * i + 1] = dummyRGBA[4 * i + 2] = 255 * i / (dataX * dataY);
    //     // OPACITY
    //     dummyRGBA[4 * i + 3] = 255;
    // }
    for (var i = 0; i < dataX * dataY; i++) {
        // RGB from 0 to 255
        // dummy[i]= 255 * i / (dataX * dataY);
        dummy[i] = Math.random();
    }
    dummyRGBA = ToColor(dummy, 1);

    dummyDataTex = new THREE.DataTexture(dummyRGBA, dataX, dataY, THREE.RGBAFormat);
    dummyDataTex.needsUpdate = true;
    var material = new THREE.MeshBasicMaterial({map: dummyDataTex, wireframe: false, transparent: true, opacity: 1});// map: dummyDataTex, color:0x8080FF,
    material.depthWrite = false;
    material.depthTest = false;
    squareMesh = new THREE.Mesh(squareGeometry, material);
    squareMesh.renderOrder = 2;
    scene.add(squareMesh);
    squareMesh.renderOrder = 1;

}

function DrawMapRectangle(step, vert_step) {
    var i = vert_step;
    var j = horizontal - 1 - step;
    if (tiles.indexOf(new THREE.Vector3(zoom, j, i)) == -1) {
        var point1 = CoordinatesFromMercator(step, vert_step);
        var point2 = CoordinatesFromMercator(step + 1, vert_step + 1);
        var x1 = Math.max(point1.x, point2.x);
        var y1 = Math.max(point1.y, point2.y);
        var x2 = Math.min(point1.x, point2.x);
        var y2 = Math.min(point1.y, point2.y);
        var squareGeometry = new THREE.Geometry();
        var x_step = Math.abs((x2 - x1) / xy_count);
        var y_step = Math.abs((y2 - y1) / xy_count);
        ii = .0;
        jj = .0;
        ii += x1;
        jj += y1;
//			console.log(" tot: ",x1,ii-x2,ii,ii+x_step,x2,y1,jj,jj-y2,jj+y_step,y2);
        while (true) {
            while (true) {
                squareGeometry.vertices.push(GetCoordinates(ii, jj, 1));
                ii -= x_step;
                if (ii - x2 <= -0.000000001)break;
            }
            jj -= y_step;
            ii = x1;
            if (jj - y2 <= -0.000000001)break;
        }
//                console.log(x1, x_step, ii, x2, x1 - x2, y1, y_step, y2, jj, y1 - y2, xy_count);

        // squareGeometry.vertices.push(GetCoordinates(x1,y1,1));
        //    squareGeometry.vertices.push(GetCoordinates(x2,y1,1));
        // squareGeometry.vertices.push(GetCoordinates(x2,y2,1));
        //    squareGeometry.vertices.push(GetCoordinates(x1,y2,1));
        for (var ii = 0; ii < xy_count; ii++)
            for (var jj = 0; jj < xy_count; jj++) {
                squareGeometry.faces.push(new THREE.Face3(ii + jj * (xy_count + 1), (ii + 1) + jj * (xy_count + 1), (ii) + (jj + 1) * (xy_count + 1)));
                squareGeometry.faces.push(new THREE.Face3((ii + 1) + jj * (xy_count + 1), (ii + 1) + (jj + 1) * (xy_count + 1), (ii) + (jj + 1) * (xy_count + 1)));
                // squareGeometry.faces.push(new THREE.Face3(0, 1, 3));
                // squareGeometry.faces.push(new THREE.Face3(1, 4, 3));
            }
        x_step = 0;
        y_step = 1 - 1 / xy_count;
        // xy_count=1;
        while (y_step >= 0) {

            while (x_step < 1) {
//                        console.log(x_step, y_step);
                squareGeometry.faceVertexUvs[0].push([
                    new THREE.Vector2(x_step, y_step + 1 / xy_count),
                    new THREE.Vector2(x_step, y_step),
                    new THREE.Vector2(x_step + 1 / xy_count, y_step + 1 / xy_count)
                ]);
                squareGeometry.faceVertexUvs[0].push([
                    new THREE.Vector2(x_step, y_step),
                    new THREE.Vector2(x_step + 1 / xy_count, y_step),
                    new THREE.Vector2(x_step + 1 / xy_count, y_step + 1 / xy_count)
                ]);
                x_step += 1 / xy_count;

            }
            x_step = 0;
            y_step = y_step - 1 / xy_count;
        }
        squareGeometry.computeFaceNormals();

        var texture = THREE.ImageUtils.loadTexture("http://b.tile.openstreetmap.org/" + zoom + "/" + j + "/" + i + ".png");

        // var material = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide, wireframe: false});
        var material = new THREE.MeshBasicMaterial({wireframe: true});
        squareMesh = new THREE.Mesh(squareGeometry, material);

        if (checkIt(squareGeometry)) {
            // edges = new THREE.FaceNormalsHelper( squareMesh, 2, 0x00ff00, 1 );
            scene.add(squareMesh);

            squareMesh.renderOrder = 0;
            // scene.add( edges );
            tiles.push(new THREE.Vector3(zoom, j, i));
            tiles_number++;
        }
    }
    return tiles_number;
}

function getCoordinatesOfTiles() {
    horizontal = vertical = xy_count * Math.pow(2, zoom);
    var D = new Array(horizontal);
    for (var j = 0; j < horizontal; j++) {
        D[j] = new Array(vertical);
        for (var i = 0; i < vertical; i++) {
            D[j][i] = CoordinatesFromMercator(i, j);
        }
    }
    //    console.log(D);
    return D;
}


function drawEarth() {
    // trying to show camera frustrum
    // var cam=new THREE.Geometry();
    // cam.applyMatrix(cameraViewProjectionMatrix);
    // var cam_mat=new THREE.MeshBasicMaterial({color:0x00FF00, wireframe:true});
    // scene.add(cam,cam_mat);
    horizontal = vertical = Math.pow(2, zoom)
    for (var j = 0; j < vertical; j++)
        for (var i = 0; i < horizontal; i++) {
            if (!in_array(new THREE.Vector3(zoom, horizontal - 1 - i, j), tiles)) {
                DrawMapRectangle(i, j);
            }
        }
}

function distance(x1, y1, z1, x2, y2, z2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
}

function render() {
    controls.zoomSpeed = (distance(camera.position.x, camera.position.y, camera.position.z, 0, 0, 0) - 1);
    controls.rotateSpeed = controls.zoomSpeed;
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    if (zoom != 5 && distance(camera.position.x, camera.position.y, camera.position.z, 0, 0, 0) <= 1.2) {
        zoom = 5;
        clearScene(scene);
        D = getCoordinatesOfTiles();
        drawEarth();
        DrawRectangle(new THREE.Vector2(53, -9), new THREE.Vector2(65, -30));

    }
}
