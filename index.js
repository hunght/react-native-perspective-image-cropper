import React, { Component } from 'react';
import {
  NativeModules,
  PanResponder,
  Dimensions,
  Image,
  View,
  Animated,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

type Coordinates = {
  +topLeft: Number,
  +topRight: Number,
  +bottomLeft: Number,
  +bottomRight: Number,
};
type CropImageProps = {
  +image: string,
  +coordinates: Coordinates,
};

export const cropImage = ({ coordinates, image }: CropImageProps) => {
  return new Promise((resolve, reject) => {
    NativeModules.CustomCropManager.crop(coordinates, image, (err, res) => {
      if (err) {
        reject('Could not crop the image');
      }
      resolve(res.image, coordinates);
    });
  });
};

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

class CustomCrop extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewHeight: Dimensions.get('window').width * (props.height / props.width),
      height: props.height,
      width: props.width,
      image: props.initialImage,
      moving: false,
    };

    this.state = {
      ...this.state,
      topLeft: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.topLeft,
              true
            )
          : {
              x: 100,
              y: 100,
            }
      ),
      topRight: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.topRight,
              true
            )
          : {
              x: Dimensions.get('window').width - 100,
              y: 100,
            }
      ),
      bottomLeft: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.bottomLeft,
              true
            )
          : {
              x: 100,
              y: this.state.viewHeight - 100,
            }
      ),
      bottomRight: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.bottomRight,
              true
            )
          : {
              x: Dimensions.get('window').width - 100,
              y: this.state.viewHeight - 100,
            }
      ),
    };

    this.state = {
      ...this.state,
      topLeftOverlay: {
        x: this.state.topLeft.x._value,
        y: this.state.topLeft.y._value,
      },
      topRightOverlay: {
        x: this.state.topRight.x._value,
        y: this.state.topRight.y._value,
      },
      bottomLeftOverlay: {
        x: this.state.bottomLeft.x._value,
        y: this.state.bottomLeft.y._value,
      },
      bottomRightOverlay: {
        x: this.state.bottomRight.x._value,
        y: this.state.bottomRight.y._value,
      },
    };

    this.state = {
      ...this.state,
      overlayPositions: `${this.state.topLeftOverlay.x},${
        this.state.topLeftOverlay.y
      } ${this.state.topRightOverlay.x},${this.state.topRightOverlay.y} ${
        this.state.bottomRightOverlay.x
      },${this.state.bottomRightOverlay.y} ${this.state.bottomLeftOverlay.x},${
        this.state.bottomLeftOverlay.y
      }`,
    };

    this.panResponderTopLeft = this.createPanResponser(
      this.state.topLeft,
      'topLeft'
    );
    this.panResponderTopRight = this.createPanResponser(
      this.state.topRight,
      'topRight'
    );
    this.panResponderBottomLeft = this.createPanResponser(
      this.state.bottomLeft,
      'bottomLeft'
    );
    this.panResponderBottomRight = this.createPanResponser(
      this.state.bottomRight,
      'bottomRight'
    );
  }

  createPanResponser(corner, cornerKey) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return true;
      },
      onPanResponderMove: (event, gestureState) => {
        const p1 =
          cornerKey === 'topLeft'
            ? `${this.state.topLeftOverlay.x + gestureState.dx},${this.state
                .topLeftOverlay.y + gestureState.dy}`
            : `${this.state.topLeftOverlay.x},${this.state.topLeftOverlay.y}`;
        const p2 =
          cornerKey === 'topRight'
            ? `${this.state.topRightOverlay.x + gestureState.dx},${this.state
                .topRightOverlay.y + gestureState.dy}`
            : `${this.state.topRightOverlay.x},${this.state.topRightOverlay.y}`;
        const p3 =
          cornerKey === 'bottomRight'
            ? `${this.state.bottomRightOverlay.x + gestureState.dx},${this.state
                .bottomRightOverlay.y + gestureState.dy}`
            : `${this.state.bottomRightOverlay.x},${
                this.state.bottomRightOverlay.y
              }`;
        const p4 =
          cornerKey === 'bottomLeft'
            ? `${this.state.bottomLeftOverlay.x + gestureState.dx},${this.state
                .bottomLeftOverlay.y + gestureState.dy}`
            : `${this.state.bottomLeftOverlay.x},${
                this.state.bottomLeftOverlay.y
              }`;

        this.setState({ overlayPositions: `${p1} ${p2} ${p3} ${p4}` });

        Animated.event([
          null,
          {
            dx: corner.x,
            dy: corner.y,
          },
        ])(event, gestureState);
      },
      onPanResponderRelease: () => {
        corner.flattenOffset();
        this.updateOverlayString();
      },
      onPanResponderGrant: () => {
        corner.setOffset({ x: corner.x._value, y: corner.y._value });
        corner.setValue({ x: 0, y: 0 });
      },
    });
  }

  crop() {
    return new Promise((resolve, reject) => {
      const coordinates = {
        topLeft: this.viewCoordinatesToImageCoordinates(this.state.topLeft),
        topRight: this.viewCoordinatesToImageCoordinates(this.state.topRight),
        bottomLeft: this.viewCoordinatesToImageCoordinates(
          this.state.bottomLeft
        ),
        bottomRight: this.viewCoordinatesToImageCoordinates(
          this.state.bottomRight
        ),
      };
      NativeModules.CustomCropManager.crop(
        coordinates,
        this.state.image,
        (err, res) => {
          if (err) {
            reject('Could not crop the image');
          }
          resolve(res.image, coordinates);
        }
      );
    });
  }

  updateOverlayString() {
    this.setState({
      topLeftOverlay: {
        x: this.state.topLeft.x._value,
        y: this.state.topLeft.y._value,
      },
      topRightOverlay: {
        x: this.state.topRight.x._value,
        y: this.state.topRight.y._value,
      },
      bottomLeftOverlay: {
        x: this.state.bottomLeft.x._value,
        y: this.state.bottomLeft.y._value,
      },
      bottomRightOverlay: {
        x: this.state.bottomRight.x._value,
        y: this.state.bottomRight.y._value,
      },
    });
  }

  imageCoordinatesToViewCoordinates(corner) {
    return {
      x: corner.x * Dimensions.get('window').width / this.state.width,
      y: corner.y * this.state.viewHeight / this.state.height,
    };
  }

  viewCoordinatesToImageCoordinates(corner) {
    return {
      x: corner.x._value / Dimensions.get('window').width * this.state.width,
      y: corner.y._value / this.state.viewHeight * this.state.height,
    };
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={[
            s(this.props).cropContainer,
            {
              height: this.state.viewHeight,
            },
          ]}
        >
          <Image
            style={[s(this.props).image, { height: this.state.viewHeight }]}
            resizeMode="contain"
            source={{ uri: `data:image/jpeg;base64,${this.state.image}` }}
          />
          <Svg
            height={this.state.viewHeight}
            width={Dimensions.get('window').width}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          >
            <AnimatedPolygon
              ref={ref => (this.polygon = ref)}
              fill={this.props.overlayColor || 'blue'}
              fillOpacity={this.props.overlayOpacity || 0.5}
              stroke={this.props.overlayStrokeColor || 'blue'}
              points={this.state.overlayPositions}
              strokeWidth={this.props.overlayStrokeWidth || 3}
            />
          </Svg>
          <Animated.View
            {...this.panResponderTopLeft.panHandlers}
            style={[this.state.topLeft.getLayout(), s(this.props).handler]}
          >
            <View
              style={[
                s(this.props).handlerI,
                {
                  left: -10,
                  top: -10,
                },
              ]}
            />
            <View
              style={[
                s(this.props).handlerRound,
                {
                  left: 31,
                  top: 31,
                },
              ]}
            />
          </Animated.View>
          <Animated.View
            {...this.panResponderTopRight.panHandlers}
            style={[this.state.topRight.getLayout(), s(this.props).handler]}
          >
            <View
              style={[
                s(this.props).handlerI,
                {
                  left: 10,
                  top: -10,
                },
              ]}
            />
            <View
              style={[
                s(this.props).handlerRound,
                {
                  right: 31,
                  top: 31,
                },
              ]}
            />
          </Animated.View>
          <Animated.View
            {...this.panResponderBottomLeft.panHandlers}
            style={[this.state.bottomLeft.getLayout(), s(this.props).handler]}
          >
            <View
              style={[
                s(this.props).handlerI,
                {
                  left: -10,
                  top: 10,
                },
              ]}
            />
            <View
              style={[
                s(this.props).handlerRound,
                {
                  left: 31,
                  bottom: 31,
                },
              ]}
            />
          </Animated.View>
          <Animated.View
            {...this.panResponderBottomRight.panHandlers}
            style={[this.state.bottomRight.getLayout(), s(this.props).handler]}
          >
            <View
              style={[
                s(this.props).handlerI,
                {
                  left: 10,
                  top: 10,
                },
              ]}
            />
            <View
              style={[
                s(this.props).handlerRound,
                {
                  right: 31,
                  bottom: 31,
                },
              ]}
            />
          </Animated.View>
        </View>
      </View>
    );
  }
}

const s = props => {
  return {
    handlerI: {
      borderRadius: 0,
      height: 20,
      width: 20,
      backgroundColor: props.handlerColor || 'blue',
    },
    handlerRound: {
      width: 39,
      position: 'absolute',
      height: 39,
      borderRadius: 100,
      backgroundColor: props.handlerColor || 'blue',
    },
    image: {
      width: Dimensions.get('window').width,
      position: 'absolute',
    },
    bottomButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'blue',
      width: 70,
      height: 70,
      borderRadius: 100,
    },
    handler: {
      height: 140,
      width: 140,
      overflow: 'visible',
      marginLeft: -70,
      marginTop: -70,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
    },
    cropContainer: {
      position: 'absolute',
      left: 0,
      width: Dimensions.get('window').width,
      top: 0,
    },
  };
};

export default CustomCrop;
