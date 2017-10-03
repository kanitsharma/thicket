import React, { Component } from 'react'
import gifshot from 'gifshot'
import ProgressMapper from './ProgressMapper'
import './Camera.css'
import {
  Accept as AcceptIcon,
  Again as AgainIcon,
  Shoot as ShootIcon,
  Cancel as CancelIcon,
} from '../NavLinks'
import { GIF_DURATION, GIF_OPTIONS } from './settings'

import { saveImage } from '../syncedDB'

// modes
const STANDBY = 'awaiting further instruction'
const SHOOTING = 'capturing and processing video'
const REVIEW = 'review, possibly save gif'

class Camera extends Component {

  state = { stream: null, mode: STANDBY }

  componentDidMount() {
    this.startVideo()
  }

  componentWillUnmount() {
    this.stopVideo()
  }

  render() {
    const { mode } = this.state
    return <div className="camera">
      <div className="camera__content">
        <div className="camera__capture" style={{ display: mode === REVIEW && 'none' }}>
          <video
            ref={v => this.video = v}
            style={{width: GIF_OPTIONS.gifWidth, height: GIF_OPTIONS.gifHeight}}
            autoPlay
          />
        </div>
        <div className="camera__preview" style={{ display: mode !== REVIEW && 'none' }}>
          <img alt="" ref={img => this.preview = img} />
        </div>
      </div>
      <div className="camera__controls">
        {mode === STANDBY && [
          <ShootIcon key="shoot" onClick={this.capture} alt="Shoot" />,
          <CancelIcon key="cancel" to="/" alt="Cancel" />,
        ]}
        {mode === SHOOTING && <ProgressMapper />}
        {mode === REVIEW && [
          <AcceptIcon key="accept" onClick={this.accept} alt="Accept" />,
          <AgainIcon key="again" onClick={this.again} alt="Again" />,
          <CancelIcon key="cancel" to="/" alt="Cancel" />,
        ]}
      </div>
    </div>
  }

  startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.video.src = window.URL.createObjectURL(stream)
        this.video.play()
        this.setState({ stream, mode: STANDBY })
      })
  }

  stopVideo = () => {
    const video = this.video
    video.pause()
    video.src = ''
    this.state.stream.getTracks().forEach(t => t.stop())
  }

  accept = () => {
    saveImage(this.preview.src)
      .then(() => this.props.history.push('/'))
  }

  again = () => {
    this.startVideo()
    this.removePreview()
    this.setState({ mode: STANDBY})
  }

  removePreview = () => {
    this.preview.src = ''
  }

  capture = () => {
    setTimeout(this.stopVideo, GIF_DURATION);
    this.setState({ mode: SHOOTING }, () => {
      gifshot.createGIF({
        ...GIF_OPTIONS,
        webcamVideoElement: this.video,
        cameraStream: this.state.stream,
      }, obj => {
        if (obj.error) {
          console.warn('GIFshot error: ', obj.error, obj.errorCode, obj.errorMsg, obj)
          this.setState({ mode: STANDBY })
          return
        }
        this.preview.src = obj.image
        this.setState({ mode: REVIEW })
      })
    })
  }
}

export default Camera