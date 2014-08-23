/** @jsx React.DOM */

var React = require('react')
, url = require('url')
, parsedUrl = url.parse(location.href, true)
, query = parsedUrl.query
, $lgtmForm = $('#lgtm-form')
, transparentGIFUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
, store = require('store')
;

if (!store.enabled) {
  alert('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade to a modern browser.');
}

var LGTMSubmitImage = React.createClass({
  getInitialState: function() {
    return {lgtm: {hash: '', actualImageUrl: transparentGIFUrl}};
  }
  , lgtmEndPoint: function(mode) {
    if (mode == 'random') {
      return 'http://www.lgtm.in/g';
    } else {
      return 'http://www.lgtm.in/g/' + this.props.loginUser;
    }
  }
  , updateLGTMs: function(mode) {
    var self = this;
    $.getJSON(this.lgtmEndPoint(mode) + '?' + this.props.requestId)
      .done(function (data) {
        self.setState({lgtm: data})
      });
  }
  , componentDidMount: function() {
    var self = this;
    $(window).on('lgtm:text-change', function(ev, text) {
      $(self.refs.text.getDOMNode()).val(text);
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
        <button className='lgtm-form__item.is-submit' typo='submit'>
          <img src={this.state.lgtm.actualImageUrl} />
        </button>
      </form>
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
    return {value: store.get('text') || 'LGTM!'};
  }
  , componentDidMount: function() {
    var self = this;
    setTimeout(function() { self.handleChange(); }, 500);
  }
  , handleChange: function() {
    var value = this.refs.textarea.getDOMNode().value.trim()
    store.set('text', value)
    this.setState({value: value});
  }
  , componentWillUpdate: function(nextProps, nextState) {
    $(this.getDOMNode()).trigger('lgtm:text-change', nextState.value);
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
      $(self.getDOMNode()).trigger('lgtm:mode-change', self.state.mode);
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
    $(this.getDOMNode()).trigger('lgtm:mode-change', nextState.mode);
  }
  , render: function() {
    return (
      <div className='mode'>
        {(this.state.mode === 'random') ?
          <div>
            <span className='mode__random is-selected'>Random</span>
            <a className='mode__mylist' onClick={this.modeToMyList}>My List</a>
          </div>
          :
          <div>
            <a className='mode__random' onClick={this.modeToRandom}>Random</a>
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

React.renderComponent(<LGTMForm csrf={$lgtmForm.data('csrf')}
                                loginUser={$lgtmForm.data('login-user')} />,
                      $lgtmForm.get(0)
                     );
