/** @jsx React.DOM */

var React = require('react')
, ReactDOM = require('react-dom')
, url = require('url')
, parsedUrl = url.parse(location.href, true)
, query = parsedUrl.query
, $lgtmForm = $('#lgtm-form')
, store = require('store')
;

if (!store.enabled) {
  alert('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade to a modern browser.');
}

var LGTMSubmitImage = React.createClass({
  getInitialState: function() {
    return {lgtm: {hash: '' }};
  }
  , lgtmEndPoint: function(mode) {
    if (mode == 'random') {
      return '/random';
    } else {
      return '/random?user=' + this.props.loginUser;
    }
  }
  , imageUrl: function() {
    return '//lgtm.in/p/' + this.state.lgtm.hash;
  }
  , updateLGTMs: function(mode) {
    var self = this;
    $.getJSON(this.lgtmEndPoint(mode) + '?' + this.props.requestId)
      .done(function (data) { self.setState({lgtm: data}) });
  }
  , componentDidMount: function() {
    var self = this
    , $el = $(ReactDOM.findDOMNode(self));
    $(window).on('lgtm:text-change', function(ev, text) {
      $(ReactDOM.findDOMNode(self.refs.text)).val(text);
    });
    $el.on('submit', function(ev) {
      $el.find('.is-submit').attr('disabled', true);
    });
  }
  , componentWillUnmount: function() {
    $(window).off('lgtm:text-change');
  }
  , componentWillReceiveProps: function(nextProps) {
    if (this.props.mode != nextProps.mode) {
      this.replaceState(this.getInitialState());
      this.updateLGTMs(nextProps.mode);
    }
  }
  , render: function() {
    var self = this;
    return (
      (function() {
        if (self.state.lgtm.hash == '') {
          return (
            <div className='loading'>
              <p>Loading...</p>
            </div>
          );
        } else {
          return (
            <form className='lgtm-form' method='post' action='/lgtm'
                  data-mode={self.props.mode}>
              <input className='lgtm-form__item' type='hidden'
                     name='_csrf' value={self.props.csrf} />
              <input className='lgtm-form__item' type='hidden'
                     name='text' ref='text' />
              <input className='lgtm-form__item' type='hidden'
                     name='user' value={self.props.user} />
              <input className='lgtm-form__item' type='hidden'
                     name='repo' value={self.props.repo} />
              <input className='lgtm-form__item' type='hidden'
                     name='number' value={self.props.number} />
              <input className='lgtm-form__item' type='hidden'
                     name='hash' value={self.state.lgtm.hash} />
              <button className='lgtm-form__item is-submit' type='submit'>
                <img src={self.imageUrl()} />
              </button>
            </form>
          );
        }
      })()
    );
  }
});

var LGTMSubmitImageList = React.createClass({
  getInitialState: function() {
    return {indexes: [1, 2, 3], mode: 'notinit'};
  }
  , componentDidMount: function() {
    var self = this;
    $(window).on('lgtm:mode-change', function(ev, mode) {
      self.setState({mode: mode});
    });
  }
  , componentWillUnmount: function() {
    $(window).off('lgtm:mode-change');
  }
  , render: function() {
    var self = this;
    return (
      <div>
        { (self.state.mode == 'mylist') ? (
            <div className='browse-link'>
              <a href='http://www.lgtm.in/browse' target='_blank'>
                 Add more to My List.
               </a>
            </div>
          )
         : <div></div> }
        <ul data-mode={this.props.mode}>
        {this.state.indexes.map(function(idx) {
          return (
            <li key={idx}>
              <LGTMSubmitImage user={query.user} repo={query.repo}
                               number={query.number}
                               csrf={self.props.csrf}
                               loginUser={self.props.loginUser}
                               mode={self.state.mode}
                               requestId={idx} />
            </li>
          );
        })}
        </ul>
      </div>
    );
  }
});

var TextForm = React.createClass({
  getInitialState: function() {
    return {value: store.get('text') || 'LGTM'};
  }
  , componentDidMount: function() {
    var self = this;
    setTimeout(function() { self.handleChange(); }, 500);
  }
  , handleChange: function() {
    var value = ReactDOM.findDOMNode(this.refs.textarea).value.trim()
    store.set('text', value)
    this.setState({value: value});
  }
  , componentWillUpdate: function(nextProps, nextState) {
    $(ReactDOM.findDOMNode(this)).trigger('lgtm:text-change', nextState.value);
  }
  , render: function() {
    return (
      <div className='text'>
        <textarea placeholder='Additional text here..'
                  onChange={this.handleChange}
                  defaultValue={this.state.value}
                  ref='textarea' />
      </div>
    );
  }
});

var ModeSelector = React.createClass({
  getInitialState: function() {
    return {mode: store.get('mode') || 'random'};
  }
  , componentDidMount: function() {
    var self = this;
    setTimeout(function() {
      $(ReactDOM.findDOMNode(self)).trigger('lgtm:mode-change', self.state.mode);
    }, 500);
  }
  , handleModeChange: function(mode) {
    this.setState({mode: mode});
    store.set('mode', mode)
  }
  , modeToMyList: function() {
    this.handleModeChange('mylist');
  }
  , modeToRandom: function() {
    this.handleModeChange('random');
  }
  , componentWillUpdate: function(nextProps, nextState) {
    $(ReactDOM.findDOMNode(this)).trigger('lgtm:mode-change', nextState.mode);
  }
  , render: function() {
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
});

var LGTMForm = React.createClass({
  render: function() {
    return (
      <div>
        <ModeSelector />
        <TextForm />
        <LGTMSubmitImageList csrf={this.props.csrf}
                             loginUser={this.props.loginUser}/>
      </div>
    );
  }
});

ReactDOM.render(<LGTMForm csrf={$lgtmForm.data('csrf')}
                          loginUser={$lgtmForm.data('login-user')} />,
                $lgtmForm.get(0)
               );
