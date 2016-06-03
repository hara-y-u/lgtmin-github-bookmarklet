import React from 'react';
import ReactDOM from 'react-dom';
import url from 'url';
import store from 'store';

let parsedUrl = url.parse(location.href, true)
, query = parsedUrl.query
, $lgtmForm = $('#lgtm-form')
;

if (!store.enabled) {
  alert('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade to a modern browser.');
}

class LGTMSubmitImage extends React.Component {
  get initialState() {
    return {lgtm: {hash: '' }};
  }
  constructor(props) {
    super(props);
    this.state = this.initialState;
  }
  lgtmEndPoint(mode) {
    if (mode == 'random') {
      return '/random';
    } else {
      return '/random?user=' + this.props.loginUser;
    }
  }
  imageUrl() {
    return '//lgtm.in/p/' + this.state.lgtm.hash;
  }
  updateLGTMs(mode) {
    if (this.lgtmReq) { this.lgtmReq.abort(); }
    this.lgtmReq = $.getJSON(
      this.lgtmEndPoint(mode) + '?' + this.props.requestId
    ).done((data) => { this.setState({lgtm: data}); });
  }
  componentDidMount() {
    let $el = $(ReactDOM.findDOMNode(this))
    ;
    $(window).on('lgtm:text-change', (ev, text) => {
      $(ReactDOM.findDOMNode(this.refs.text)).val(text);
    });
    $el.on('submit', (ev) => {
      $el.find('.is-submit').attr('disabled', true);
    });
  }
  componentWillUnmount() {
    $(window).off('lgtm:text-change');
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.mode != nextProps.mode) {
      this.setState(this.initialState);
      this.updateLGTMs(nextProps.mode);
    }
  }
  render() {
    return (
      <form className='lgtm-form' method='post' action='/lgtm'
            data-mode={this.props.mode}>
        <input className='lgtm-form__item' type='hidden'
               name='_csrf' value={this.props.csrf} />
        <input className='lgtm-form__item' type='hidden'
               name='text' ref='text' />
        <input className='lgtm-form__item' type='hidden'
               name='user' value={this.props.user} />
        <input className='lgtm-form__item' type='hidden'
               name='repo' value={this.props.repo} />
        <input className='lgtm-form__item' type='hidden'
               name='number' value={this.props.number} />
        <input className='lgtm-form__item' type='hidden'
               name='hash' value={this.state.lgtm.hash} />
        {(() => {
          if (this.state.lgtm.hash == '') {
            return <div className='loading'><p>Loading...</p></div>;
          } else {
            return (
              <button className='lgtm-form__item is-submit' type='submit'>
                <img src={this.imageUrl()} />
              </button>
            );
          }
        })()}
      </form>
    );
  }
}

class LGTMSubmitImageList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {indexes: [1, 2, 3], mode: 'notinit'};
  }
  componentDidMount() {
    $(window).on('lgtm:mode-change', (ev, mode) => {
      this.setState({mode: mode});
    });
  }
  componentWillUnmount() {
    $(window).off('lgtm:mode-change');
  }
  render() {
    return (
      <div>
        { (this.state.mode == 'mylist') ? (
            <div className='browse-link'>
              <a href='http://www.lgtm.in/browse' target='_blank'>
                 Add more to My List.
               </a>
            </div>
          )
         : <div></div> }
        <ul data-mode={this.props.mode}>
        {this.state.indexes.map((idx) => {
          return (
            <li key={idx}>
              <LGTMSubmitImage user={query.user} repo={query.repo}
                               number={query.number}
                               csrf={this.props.csrf}
                               loginUser={this.props.loginUser}
                               mode={this.state.mode}
                               requestId={idx} />
            </li>
          );
        })}
        </ul>
      </div>
    );
  }
}

class TextForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: store.get('text') };
    this.handleChange = this.handleChange.bind(this);
  }
  componentDidMount() {
    setTimeout(() => { this.handleChange(); }, 500);
  }
  handleChange() {
    let value = ReactDOM.findDOMNode(this.refs.textarea).value.trim()
    store.set('text', value)
    this.setState({value: value});
  }
  componentWillUpdate(nextProps, nextState) {
    $(ReactDOM.findDOMNode(this)).trigger('lgtm:text-change', nextState.value);
  }
  render() {
    return (
      <div className='text'>
        <textarea placeholder='Additional text here..'
                  onChange={this.handleChange}
                  defaultValue={this.state.value}
                  ref='textarea' />
      </div>
    );
  }
}

class ModeSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {mode: store.get('mode') || 'random'};
    this.modeToMyList = this.modeToMyList.bind(this);
    this.modeToRandom = this.modeToRandom.bind(this);
  }
  componentDidMount() {
    setTimeout(() => {
      $(ReactDOM.findDOMNode(this)).trigger('lgtm:mode-change', this.state.mode);
    }, 500);
  }
  handleModeChange(mode) {
    this.setState({mode: mode});
    store.set('mode', mode);
  }
  modeToMyList() {
    this.handleModeChange('mylist');
  }
  modeToRandom() {
    this.handleModeChange('random');
  }
  componentWillUpdate(nextProps, nextState) {
    $(ReactDOM.findDOMNode(this)).trigger('lgtm:mode-change', nextState.mode);
  }
  render() {
    return (
      <div className='mode'>
        {(this.state.mode === 'random') ?
          <div>
            <span className='mode__random is-selected'>Random</span>
            <a className='mode__mylist' onClick={this.modeToMyList}
               href='javascript:void(0);'>
              My List
            </a>
          </div>
          :
          <div>
            <a className='mode__random' onClick={this.modeToRandom}
               href='javascript:void(0);'>
              Random
            </a>
            <span className='mode__mylist is-selected'>My List</span>
          </div>
        }
      </div>
    );
  }
}

class LGTMForm extends React.Component {
  render() {
    return (
      <div>
        <ModeSelector />
        <TextForm />
        <LGTMSubmitImageList csrf={this.props.csrf}
                             loginUser={this.props.loginUser}/>
      </div>
    );
  }
}

ReactDOM.render(<LGTMForm csrf={$lgtmForm.data('csrf')}
                          loginUser={$lgtmForm.data('login-user')} />,
                $lgtmForm.get(0)
               );
