(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  (function($) {
    var KEY;
    KEY = {
      BACKSPACE: 8,
      TAB: 9,
      RETURN: 13,
      ESCAPE: 27,
      SPACE: 32,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      COLON: 188,
      DOT: 190
    };
    $.MultiSelect = (function() {
      function MultiSelect(element, options) {
        this.options = {
          readonly: false,
          input_type: "input",
          input_class: null,
          separator: ",",
          completions: [],
          input_references: null,
          min_query_length: 0,
          on_search: null,
          on_search_timeout: 300,
          max_complete_results: 5,
          max_selection_length: null,
          enable_new_options: true,
          complex_search: true
        };
        $.extend(this.options, options || {});
        this.values = [];
        this.input = $(element);
        this.initialize_elements();
        this.initialize_events();
        this.parse_value();
      }
      MultiSelect.prototype.initialize_elements = function() {
        this.hidden = $(document.createElement("input"));
        this.hidden.attr("name", this.input.attr("name"));
        this.hidden.attr("type", "hidden");
        this.input.removeAttr("name");
        if (this.options.input_class) {
          this.input.addClass(this.options.input_class);
        }
        this.container = $(document.createElement("div"));
        this.container.addClass("jquery-multiselect");
        this.input_wrapper = $(document.createElement("a"));
        this.input_wrapper.addClass("bit-input");
        this.input.replaceWith(this.container);
        this.container.append(this.input_wrapper);
        this.input_wrapper.append(this.input);
        return this.container.before(this.hidden);
      };
      MultiSelect.prototype.initialize_events = function() {
        this.selection = new $.MultiSelect.Selection(this.input);
        this.resizable = new $.MultiSelect.ResizableInput(this.input);
        this.observer = new $.MultiSelect.InputObserver(this.input);
        this.autocomplete = new $.MultiSelect.AutoComplete(this, this.options.completions);
        this.input.click(__bind(function(e) {
          return e.stopPropagation();
        }, this));
        this.input.keyup(__bind(function() {
          return this.parse_value(1);
        }, this));
        this.container.click(__bind(function() {
          this.input.focus();
          return this.selection.set_caret_at_end();
        }, this));
        this.observer.bind([KEY.TAB, KEY.RETURN], __bind(function(e) {
          if (this.autocomplete.val()) {
            e.preventDefault();
            return this.add_and_reset();
          }
        }, this));
        this.observer.bind([KEY.BACKSPACE], __bind(function(e) {
          var caret;
          if (this.values.length <= 0) {
            return;
          }
          caret = this.selection.get_caret();
          if (caret[0] === 0 && caret[1] === 0) {
            e.preventDefault();
            return this.remove(this.values[this.values.length - 1]);
          }
        }, this));
        this.input.blur(__bind(function() {
          return setTimeout(__bind(function() {
            return this.autocomplete.hide_complete_box();
          }, this), 200);
        }, this));
        return this.observer.bind([KEY.ESCAPE], __bind(function(e) {
          return this.autocomplete.hide_complete_box();
        }, this));
      };
      MultiSelect.prototype.values_real = function() {
        return $.map(this.values, function(v) {
          return v[1];
        });
      };
      MultiSelect.prototype.parse_value = function(min) {
        var caption, refs, value, values, _i, _len;
        if (min == null) {
          min = 0;
        }
        if (this.options.input_type === "input") {
          values = this.input.val().split(this.options.separator);
        } else {
          values = this.options.input_values;
        }
        if (values.length > min) {
          for (_i = 0, _len = values.length; _i < _len; _i++) {
            value = values[_i];
            if (value.present()) {
              if (this.options.input_references) {
                refs = this.options.input_references;
                if (typeof refs === 'function') {
                  refs = refs();
                }
                caption = refs[value] || value;
                this.add([caption, value]);
              } else {
                this.add([value, value]);
              }
            }
          }
          this.input.val("");
          this.autocomplete.search();
        }
        if (this.options.readonly) {
          return this.input.hide();
        }
      };
      MultiSelect.prototype.add_and_reset = function() {
        if (this.autocomplete.val()) {
          this.add(this.autocomplete.val());
          this.input.val("");
          return this.autocomplete.search();
        }
      };
      MultiSelect.prototype.add = function(value) {
        var a, close;
        if ($.inArray(value[1], this.values_real()) > -1) {
          return;
        }
        if (value[0].blank()) {
          return;
        }
        value[1] = value[1].trim();
        this.values.push(value);
        a = $(document.createElement("a"));
        a.addClass("bit bit-box");
        a.mouseover(function() {
          return $(this).addClass("bit-hover");
        });
        a.mouseout(function() {
          return $(this).removeClass("bit-hover");
        });
        a.data("value", value);
        a.html(value[0].entitizeHTML());
        if (!this.options.readonly) {
          close = $(document.createElement("a"));
          close.addClass("closebutton");
          close.click(__bind(function() {
            return this.remove(a.data("value"));
          }, this));
          a.append(close);
        }
        this.input_wrapper.before(a);
        if (this.options.readonly || (this.options.max_selection_length && (this.values.length >= this.options.max_selection_length))) {
          this.input.hide();
        }
        return this.refresh_hidden();
      };
      MultiSelect.prototype.remove = function(value) {
        this.values = $.grep(this.values, function(v) {
          return v[1] !== value[1];
        });
        this.container.find("a.bit-box").each(function() {
          if ($(this).data("value")[1] === value[1]) {
            return $(this).remove();
          }
        });
        this.input.show();
        return this.refresh_hidden();
      };
      MultiSelect.prototype.refresh_hidden = function() {
        return this.hidden.val(this.values_real().join(this.options.separator));
      };
      return MultiSelect;
    })();
    $.MultiSelect.InputObserver = (function() {
      function InputObserver(element) {
        this.input = $(element);
        this.input.keydown(__bind(function(e) {
          return this.handle_keydown(e);
        }, this));
        this.events = [];
      }
      InputObserver.prototype.bind = function(key, callback) {
        return this.events.push([key, callback]);
      };
      InputObserver.prototype.handle_keydown = function(e) {
        var callback, event, keys, _i, _len, _ref, _results;
        _ref = this.events;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          event = _ref[_i];
          keys = event[0], callback = event[1];
          if (!keys.push) {
            keys = [keys];
          }
          _results.push($.inArray(e.keyCode, keys) > -1 ? callback(e) : void 0);
        }
        return _results;
      };
      return InputObserver;
    })();
    $.MultiSelect.Selection = (function() {
      function Selection(element) {
        this.input = $(element)[0];
      }
      Selection.prototype.get_caret = function() {
        var r;
        if (document.selection) {
          r = document.selection.createRange().duplicate();
          r.moveEnd('character', this.input.value.length);
          if (r.text === '') {
            return [this.input.value.length, this.input.value.length];
          } else {
            return [this.input.value.lastIndexOf(r.text), this.input.value.lastIndexOf(r.text)];
          }
        } else {
          return [this.input.selectionStart, this.input.selectionEnd];
        }
      };
      Selection.prototype.set_caret = function(begin, end) {
        if (end == null) {
          end = begin;
        }
        this.input.selectionStart = begin;
        return this.input.selectionEnd = end;
      };
      Selection.prototype.set_caret_at_end = function() {
        return this.set_caret(this.input.value.length);
      };
      return Selection;
    })();
    $.MultiSelect.ResizableInput = (function() {
      function ResizableInput(element) {
        this.input = $(element);
        this.create_measurer();
        this.input.keypress(__bind(function(e) {
          return this.set_width(e);
        }, this));
        this.input.keyup(__bind(function(e) {
          return this.set_width(e);
        }, this));
        this.input.change(__bind(function(e) {
          return this.set_width(e);
        }, this));
      }
      ResizableInput.prototype.create_measurer = function() {
        var measurer;
        if ($("#__jquery_multiselect_measurer")[0] === void 0) {
          measurer = $(document.createElement("div"));
          measurer.attr("id", "__jquery_multiselect_measurer");
          measurer.css({
            position: "absolute",
            left: "-1000px",
            top: "-1000px"
          });
          $(document.body).append(measurer);
        }
        this.measurer = $("#__jquery_multiselect_measurer:first");
        return this.measurer.css({
          fontSize: this.input.css('font-size'),
          fontFamily: this.input.css('font-family')
        });
      };
      ResizableInput.prototype.calculate_width = function() {
        this.measurer.html(this.input.val().entitizeHTML() + 'MM');
        return this.measurer.innerWidth();
      };
      ResizableInput.prototype.set_width = function() {
        return this.input.css("width", this.calculate_width() + "px");
      };
      return ResizableInput;
    })();
    $.MultiSelect.AutoComplete = (function() {
      function AutoComplete(multiselect, completions) {
        this.timer = null;
        this.busy = 0;
        this.multiselect = multiselect;
        this.input = this.multiselect.input;
        this.completions = this.parse_completions(completions);
        this.matches = [];
        this.create_elements();
        this.bind_events();
      }
      AutoComplete.prototype.parse_completions = function(completions) {
        return $.map(completions, function(value) {
          if (typeof value === "string") {
            return [[value, value]];
          } else if (value instanceof Array && value.length === 2) {
            return [value];
          } else if (value.value && value.caption) {
            return [[value.caption, value.value]];
          } else {
            if (console) {
              return console.error("Invalid option " + value);
            }
          }
        });
      };
      AutoComplete.prototype.create_elements = function() {
        var width;
        this.container = $(document.createElement("div"));
        this.container.addClass("jquery-multiselect-autocomplete");
        width = this.multiselect.container.outerWidth();
        if (width < 200) {
          width = 200;
        }
        this.container.css("width", width);
        this.container.css("display", "none");
        this.container.append(this.def);
        this.list = $(document.createElement("ul"));
        this.list.addClass("feed");
        this.container.append(this.list);
        return this.multiselect.container.after(this.container);
      };
      AutoComplete.prototype.bind_events = function() {
        this.input.keypress(__bind(function(e) {
          return this.search(e);
        }, this));
        this.input.keyup(__bind(function(e) {
          return this.search(e);
        }, this));
        this.input.change(__bind(function(e) {
          return this.search(e);
        }, this));
        this.multiselect.observer.bind(KEY.UP, __bind(function(e) {
          e.preventDefault();
          return this.navigate_up();
        }, this));
        return this.multiselect.observer.bind(KEY.DOWN, __bind(function(e) {
          e.preventDefault();
          return this.navigate_down();
        }, this));
      };
      AutoComplete.prototype._setBusy = function(state) {
        if (state) {
          ++this.busy;
        } else {
          --this.busy;
        }
        return this.busy = Math.max(this.busy, 0);
      };
      AutoComplete.prototype.search = function() {
        var callback;
        if (this.multiselect.options.on_search_timeout) {
          if (this.timer) {
            clearTimeout(this.timer);
          }
          callback = function(obj) {
            return obj._search();
          };
          this.timer = setTimeout(callback, this.multiselect.options.on_search_timeout, this);
        } else {
          this._search();
        }
      };
      AutoComplete.prototype._search = function() {
        var def, i, item, option, x, _len, _ref;
        if (this.busy) {
          return;
        }
        if (this.input.val().trim() === this.query) {
          return;
        }
        this.query = this.input.val().trim();
        this.list.html("");
        this.current = 0;
        if (this.query.present() && this.query.length >= this.multiselect.options.min_query_length) {
          this.container.fadeIn("fast");
          if (this.multiselect.options.on_search) {
            this._initSearch();
          }
          this.matches = this.matching_completions(this.query);
          if (this.multiselect.options.enable_new_options) {
            def = this.create_item("Add <em>" + this.query + "</em>");
            def.mouseover(__bind(function(e) {
              return this.select_index(0);
            }, this));
          }
          _ref = this.matches;
          for (i = 0, _len = _ref.length; i < _len; i++) {
            option = _ref[i];
            x = this.multiselect.options.enable_new_options ? i + 1 : i;
            item = this.create_item(this.highlight(option[0], this.query));
            item.mouseover(__bind(function(e) {
              return this.select_index(x);
            }, this));
          }
          if (this.multiselect.options.enable_new_options) {
            this.matches.unshift([this.query, this.query]);
          }
          return this.select_index(0);
        } else {
          this.matches = [];
          this.hide_complete_box();
          return this.query = null;
        }
      };
      AutoComplete.prototype._initSearch = function() {
        var callback;
        if (this.busy) {
          callback = function(obj) {
            return obj._initSearch();
          };
          return setTimeout(callback, 100, this);
        } else {
          return this._doSearch();
        }
      };
      AutoComplete.prototype._doSearch = function() {
        var completions;
        if (this.busy) {
          return;
        }
        this._setBusy(true);
        try {
          completions = this.multiselect.options.on_search(this.query);
          return this.completions = this.parse_completions(completions);
        } finally {
          this._setBusy(false);
        }
      };
      AutoComplete.prototype.hide_complete_box = function() {
        return this.container.fadeOut("fast");
      };
      AutoComplete.prototype.select_index = function(index) {
        var items;
        items = this.list.find("li");
        items.removeClass("auto-focus");
        items.filter(":eq(" + index + ")").addClass("auto-focus");
        return this.current = index;
      };
      AutoComplete.prototype.navigate_down = function() {
        var next;
        next = this.current + 1;
        if (next >= this.matches.length) {
          next = 0;
        }
        return this.select_index(next);
      };
      AutoComplete.prototype.navigate_up = function() {
        var next;
        next = this.current - 1;
        if (next < 0) {
          next = this.matches.length - 1;
        }
        return this.select_index(next);
      };
      AutoComplete.prototype.create_item = function(text, highlight) {
        var item;
        item = $(document.createElement("li"));
        item.click(__bind(function() {
          this.multiselect.add_and_reset();
          this.search();
          return this.input.focus();
        }, this));
        item.html(text);
        this.list.append(item);
        return item;
      };
      AutoComplete.prototype.val = function() {
        return this.matches[this.current];
      };
      AutoComplete.prototype.highlight = function(text, highlight) {
        var char, current, highlighted, i, reg, _len;
        if (this.multiselect.options.complex_search) {
          highlighted = "";
          current = 0;
          for (i = 0, _len = text.length; i < _len; i++) {
            char = text[i];
            char = text.charAt(i);
            if (current < highlight.length && char.toLowerCase() === highlight.charAt(current).toLowerCase()) {
              highlighted += "<em>" + char + "</em>";
              current++;
            } else {
              highlighted += char;
            }
          }
          return highlighted;
        } else {
          reg = "(" + (RegExp.escape(highlight)) + ")";
          return text.replace(new RegExp(reg, "gi"), '<em>$1</em>');
        }
      };
      AutoComplete.prototype.matching_completions = function(text) {
        var char, count, i, reg, _len;
        if (this.multiselect.options.complex_search) {
          reg = "";
          for (i = 0, _len = text.length; i < _len; i++) {
            char = text[i];
            char = text.charAt(i);
            reg += RegExp.escape(char) + ".*";
          }
          reg = new RegExp(reg, "i");
        } else {
          reg = new RegExp(RegExp.escape(text), "i");
        }
        count = 0;
        return $.grep(this.completions, __bind(function(c) {
          if (count >= this.multiselect.options.max_complete_results) {
            return false;
          }
          if ($.inArray(c[1], this.multiselect.values_real()) > -1) {
            return false;
          }
          if (c[0].match(reg)) {
            count++;
            return true;
          } else {
            return false;
          }
        }, this));
      };
      return AutoComplete;
    })();
    return $.fn.multiselect = function(options) {
      if (options == null) {
        options = {};
      }
      return $(this).each(function() {
        var completions, input, option, select_options, values, _i, _len, _ref;
        if (this.tagName.toLowerCase() === "select") {
          input = $(document.createElement("input"));
          input.attr("type", "text");
          input.attr("name", this.name);
          input.attr("id", this.id);
          completions = [];
          values = [];
          _ref = this.options;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            option = _ref[_i];
            completions.push([option.innerHTML, option.value]);
            if (option.selected) {
              values.push(option.value);
            }
          }
          select_options = {
            completions: completions,
            input_type: "select",
            input_values: values,
            enable_new_options: false
          };
          $.extend(select_options, options);
          $(this).replaceWith(input);
          return new $.MultiSelect(input, select_options);
        } else if (this.tagName.toLowerCase() === "input" && this.type === "text") {
          return new $.MultiSelect(this, options);
        }
      });
    };
  })(jQuery);
  $.extend(String.prototype, {
    trim: function() {
      return this.replace(/^[\r\n\s]/g, '').replace(/[\r\n\s]$/g, '');
    },
    entitizeHTML: function() {
      return this.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    unentitizeHTML: function() {
      return this.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    },
    blank: function() {
      return this.trim().length === 0;
    },
    present: function() {
      return !this.blank();
    }
  });
  RegExp.escape = function(str) {
    return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
  };
}).call(this);
