import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <span className="text-5xl">🦀</span>
          <p className="text-sand-700 font-medium">出了点小问题，Coco 需要重新出发！</p>
          <p className="text-sand-500 text-sm">{this.state.error?.message}</p>
          <button
            className="px-4 py-2 bg-coco-500 text-white rounded-2xl text-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
